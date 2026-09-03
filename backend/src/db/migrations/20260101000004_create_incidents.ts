import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TYPE incident_status AS ENUM ('active', 'monitoring', 'resolved')
  `);

  await knex.schema.createTable("incidents", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name", 200).notNullable();
    table.text("description").nullable();
    table.specificType("status", "incident_status").notNullable().defaultTo("active");
    table.specificType("severity_level", "priority_level").notNullable().defaultTo("medium");
    table.integer("report_count").notNullable().defaultTo(0);
    table.integer("radius_meters").notNullable();
    table.uuid("created_by").references("id").inTable("health_workers").nullable();
    table.timestamp("first_report_at", { useTz: true }).nullable();
    table.timestamp("last_report_at", { useTz: true }).nullable();
    table.timestamps(true, true);
  });

  // Geospatial cluster center, stored as geography(Point, 4326) for accurate distance math.
  await knex.raw(`
    ALTER TABLE incidents ADD COLUMN cluster_center geography(Point, 4326) NOT NULL
  `);
  await knex.raw(`CREATE INDEX idx_incidents_cluster_center ON incidents USING GIST (cluster_center)`);
  await knex.raw(`CREATE INDEX idx_incidents_status ON incidents (status)`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("incidents");
  await knex.raw(`DROP TYPE IF EXISTS incident_status`);
}
