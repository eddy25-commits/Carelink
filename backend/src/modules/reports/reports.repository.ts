import { db } from "../../config/database";
import { Report, ReportStatus } from "../../types/domain";
import { ListReportsQuery, TriageQueueQuery } from "./reports.validation";

// Shared column list that unpacks the PostGIS `location` geography column
// into plain latitude/longitude for API consumers, keeping geospatial
// specifics out of the rest of the codebase.
const SELECT_COLUMNS = db.raw(`
  reports.*,
  ST_Y(location::geometry) AS latitude,
  ST_X(location::geometry) AS longitude
`);

export interface CreateReportRow {
  report_token: string;
  is_anonymous: boolean;
  reporter_contact: string | null;
  reporter_language: string;
  category: string;
  description: string;
  symptoms: string[];
  affected_count: number;
  address_text: string | null;
  severity_score: number;
  priority_level: string;
  status: ReportStatus;
  sla_response_due_at: Date;
  sla_resolution_due_at: Date;
  latitude?: number;
  longitude?: number;
}

function sortToOrderBy(sort: ListReportsQuery["sort"]): [string, "asc" | "desc"] {
  switch (sort) {
    case "sla_response_asc":
      return ["sla_response_due_at", "asc"];
    case "newest":
      return ["created_at", "desc"];
    case "oldest":
      return ["created_at", "asc"];
    case "severity_desc":
    default:
      return ["severity_score", "desc"];
  }
}

export const reportsRepository = {
  async create(data: CreateReportRow): Promise<Report> {
    const { latitude, longitude, ...rest } = data;

    const [row] = await db("reports")
      .insert({
        ...rest,
        symptoms: JSON.stringify(data.symptoms),
        location:
          latitude !== undefined && longitude !== undefined
            ? db.raw("ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography", [longitude, latitude])
            : null,
      })
      .returning(["id"]);

    return this.findById(row.id) as Promise<Report>;
  },

  async findById(id: string): Promise<Report | undefined> {
    return db("reports").select(SELECT_COLUMNS).where("reports.id", id).first();
  },

  async findByToken(reportToken: string): Promise<Report | undefined> {
    return db("reports").select(SELECT_COLUMNS).where({ report_token: reportToken }).first();
  },

  async list(query: ListReportsQuery): Promise<{ data: Report[]; total: number }> {
    const base = db("reports").select(SELECT_COLUMNS);
    const countBase = db("reports");

    if (query.status) {
      base.andWhere("status", query.status);
      countBase.andWhere("status", query.status);
    }
    if (query.priorityLevel) {
      base.andWhere("priority_level", query.priorityLevel);
      countBase.andWhere("priority_level", query.priorityLevel);
    }
    if (query.assignedTo) {
      base.andWhere("assigned_to", query.assignedTo);
      countBase.andWhere("assigned_to", query.assignedTo);
    }
    if (query.incidentId) {
      base.andWhere("incident_id", query.incidentId);
      countBase.andWhere("incident_id", query.incidentId);
    }
    if (query.category) {
      base.andWhere("category", query.category);
      countBase.andWhere("category", query.category);
    }

    const [orderColumn, orderDirection] = sortToOrderBy(query.sort);
    base.orderBy(orderColumn, orderDirection);
    base.offset((query.page - 1) * query.pageSize).limit(query.pageSize);

    const [data, [{ count }]] = await Promise.all([base, countBase.count<{ count: string }[]>("id as count")]);

    return { data, total: Number(count) };
  },

  /**
   * The health-worker triage dashboard's primary view: open reports
   * sorted so the most urgent, most SLA-at-risk items surface first.
   */
  async triageQueue(query: TriageQueueQuery): Promise<Report[]> {
    const base = db("reports")
      .select(SELECT_COLUMNS)
      .whereIn("status", ["submitted", "triaged", "assigned", "in_progress", "escalated"]);

    if (query.priorityLevel) base.andWhere("priority_level", query.priorityLevel);
    if (query.assignedTo) base.andWhere("assigned_to", query.assignedTo);
    if (query.unassignedOnly) base.whereNull("assigned_to");

    return base
      .orderByRaw(`
        CASE priority_level
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END ASC
      `)
      .orderBy("sla_response_due_at", "asc");
  },

  async updateStatus(
    id: string,
    fields: Partial<{
      status: ReportStatus;
      assigned_to: string | null;
      incident_id: string | null;
      triaged_at: Date;
      resolved_at: Date | null;
      sla_response_breached: boolean;
      sla_resolution_breached: boolean;
    }>
  ): Promise<Report> {
    await db("reports")
      .where({ id })
      .update({ ...fields, updated_at: db.fn.now() });
    return this.findById(id) as Promise<Report>;
  },

  /** Used by the SLA monitor job to find reports at risk or in breach. */
  async findOpenReportsPastDue(): Promise<Report[]> {
    return db("reports")
      .select(SELECT_COLUMNS)
      .whereIn("status", ["submitted", "triaged", "assigned", "in_progress"])
      .andWhere((qb) => {
        qb.where("sla_response_due_at", "<", db.fn.now()).orWhere("sla_resolution_due_at", "<", db.fn.now());
      });
  },

  /** Used by the incident-clustering job: recent reports with a known location, not yet clustered. */
  async findRecentUnclusteredWithLocation(sinceHours: number): Promise<Report[]> {
    return db("reports")
      .select(SELECT_COLUMNS)
      .whereNotNull("location")
      .andWhere("created_at", ">=", db.raw(`now() - interval '${sinceHours} hours'`));
  },
};
