import { db } from "../../config/database";
import { Incident, IncidentStatus } from "../../types/domain";

const SELECT_COLUMNS = db.raw(`
  incidents.*,
  ST_Y(cluster_center::geometry) AS latitude,
  ST_X(cluster_center::geometry) AS longitude
`);

export interface CreateIncidentRow {
  name: string;
  description?: string | null;
  severity_level: string;
  radius_meters: number;
  report_count: number;
  latitude: number;
  longitude: number;
  first_report_at: Date;
  last_report_at: Date;
  created_by?: string | null;
}

export const incidentsRepository = {
  async create(data: CreateIncidentRow): Promise<Incident> {
    const [row] = await db("incidents")
      .insert({
        name: data.name,
        description: data.description ?? null,
        severity_level: data.severity_level,
        radius_meters: data.radius_meters,
        report_count: data.report_count,
        first_report_at: data.first_report_at,
        last_report_at: data.last_report_at,
        created_by: data.created_by ?? null,
        cluster_center: db.raw("ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography", [data.longitude, data.latitude]),
      })
      .returning(["id"]);
    return this.findById(row.id) as Promise<Incident>;
  },

  async findById(id: string): Promise<Incident | undefined> {
    return db("incidents").select(SELECT_COLUMNS).where("incidents.id", id).first();
  },

  async list(status?: IncidentStatus): Promise<Incident[]> {
    const query = db("incidents").select(SELECT_COLUMNS).orderBy("last_report_at", "desc");
    if (status) query.andWhere("status", status);
    return query;
  },

  async updateReportCount(id: string, reportCount: number, lastReportAt: Date): Promise<void> {
    await db("incidents")
      .where({ id })
      .update({ report_count: reportCount, last_report_at: lastReportAt, updated_at: db.fn.now() });
  },

  async updateStatus(id: string, status: IncidentStatus): Promise<Incident> {
    await db("incidents").where({ id }).update({ status, updated_at: db.fn.now() });
    return this.findById(id) as Promise<Incident>;
  },

  /**
   * Finds an existing active incident whose cluster center lies within
   * `radiusMeters` of the given point — used to decide whether a new
   * cluster of reports should merge into an existing incident rather
   * than create a duplicate one.
   */
  async findNearbyActive(latitude: number, longitude: number, radiusMeters: number): Promise<Incident | undefined> {
    return db("incidents")
      .select(SELECT_COLUMNS)
      .where("status", "!=", "resolved")
      .andWhereRaw(`ST_DWithin(cluster_center, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)`, [
        longitude,
        latitude,
        radiusMeters,
      ])
      .first();
  },
};
