import { db } from "../../config/database";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { incidentsRepository } from "./incidents.repository";
import { reportsRepository } from "../reports/reports.repository";
import { PriorityLevel } from "../../types/domain";

interface ClusterRow {
  cluster_id: number | null;
  report_id: string;
  latitude: number;
  longitude: number;
  priority_level: PriorityLevel;
  category: string;
  created_at: string;
}

const PRIORITY_RANK: Record<PriorityLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };

function highestPriority(levels: PriorityLevel[]): PriorityLevel {
  return levels.reduce((worst, level) => (PRIORITY_RANK[level] > PRIORITY_RANK[worst] ? level : worst), "low" as PriorityLevel);
}

export const incidentClusteringService = {
  /**
   * Groups recent, geolocated reports into spatial clusters using
   * PostGIS's DBSCAN implementation (ST_ClusterDBSCAN), then creates or
   * updates Incident records for any cluster that meets the minimum
   * report threshold — surfacing potential outbreaks (proposal
   * Section 5: "geospatial data handling via PostGIS ... location-based
   * clustering of related reports").
   */
  async runClustering(): Promise<{ clustersFound: number; incidentsCreated: number; incidentsUpdated: number }> {
    const windowHours = env.INCIDENT_CLUSTER_WINDOW_HOURS;
    const epsMeters = env.INCIDENT_CLUSTER_RADIUS_METERS;
    const minReports = env.INCIDENT_CLUSTER_MIN_REPORTS;

    // ST_ClusterDBSCAN's eps is measured in the geometry's coordinate
    // units, so we transform to Web Mercator (EPSG:3857) first, which
    // is metric — a standard approach for approximate meter-based
    // clustering over small-to-city-scale areas.
    const rows = await db.raw<{ rows: ClusterRow[] }>(
      `
      SELECT
        cluster_id,
        id AS report_id,
        ST_Y(location::geometry) AS latitude,
        ST_X(location::geometry) AS longitude,
        priority_level,
        category,
        created_at
      FROM (
        SELECT
          id,
          location,
          priority_level,
          category,
          created_at,
          ST_ClusterDBSCAN(ST_Transform(location::geometry, 3857), eps := ?, minpoints := ?)
            OVER () AS cluster_id
        FROM reports
        WHERE location IS NOT NULL
          AND created_at >= now() - (? || ' hours')::interval
          AND status NOT IN ('resolved', 'closed')
      ) clustered
      WHERE cluster_id IS NOT NULL
      ORDER BY cluster_id
      `,
      [epsMeters, minReports, windowHours]
    );

    const clusters = new Map<number, ClusterRow[]>();
    for (const row of rows.rows) {
      if (row.cluster_id === null) continue;
      const bucket = clusters.get(row.cluster_id) ?? [];
      bucket.push(row);
      clusters.set(row.cluster_id, bucket);
    }

    let incidentsCreated = 0;
    let incidentsUpdated = 0;

    for (const [, members] of clusters) {
      const centroidLat = members.reduce((sum, m) => sum + Number(m.latitude), 0) / members.length;
      const centroidLng = members.reduce((sum, m) => sum + Number(m.longitude), 0) / members.length;
      const severity = highestPriority(members.map((m) => m.priority_level));
      const timestamps = members.map((m) => new Date(m.created_at).getTime());
      const firstReportAt = new Date(Math.min(...timestamps));
      const lastReportAt = new Date(Math.max(...timestamps));
      const dominantCategory = members[0]?.category ?? "suspected_outbreak";

      const existing = await incidentsRepository.findNearbyActive(centroidLat, centroidLng, epsMeters);

      let incidentId: string;
      if (existing) {
        await incidentsRepository.updateReportCount(existing.id, members.length, lastReportAt);
        incidentId = existing.id;
        incidentsUpdated++;
      } else {
        const created = await incidentsRepository.create({
          name: `Cluster of ${members.length} reports (${dominantCategory.replace(/_/g, " ")})`,
          description: `Auto-detected cluster of ${members.length} related reports within ${epsMeters}m over the last ${windowHours}h.`,
          severity_level: severity,
          radius_meters: epsMeters,
          report_count: members.length,
          latitude: centroidLat,
          longitude: centroidLng,
          first_report_at: firstReportAt,
          last_report_at: lastReportAt,
        });
        incidentId = created.id;
        incidentsCreated++;
      }

      await Promise.all(
        members.map((m) => reportsRepository.updateStatus(m.report_id, { incident_id: incidentId }))
      );
    }

    logger.info(
      { clustersFound: clusters.size, incidentsCreated, incidentsUpdated },
      "Incident clustering run complete"
    );

    return { clustersFound: clusters.size, incidentsCreated, incidentsUpdated };
  },
};
