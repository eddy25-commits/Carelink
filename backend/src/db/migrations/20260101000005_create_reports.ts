import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TYPE report_status AS ENUM (
      'submitted', 'triaged', 'assigned', 'in_progress', 'escalated', 'resolved', 'closed'
    )
  `);
  await knex.raw(`
    CREATE TYPE report_category AS ENUM (
      'individual_symptom', 'suspected_outbreak', 'environmental_hazard', 'other'
    )
  `);

  await knex.schema.createTable("reports", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    // Public, non-sequential token so an anonymous reporter can check status without login.
    table.string("report_token", 16).notNullable().unique();

    table.boolean("is_anonymous").notNullable().defaultTo(false);
    table.string("reporter_contact", 100).nullable().comment("Phone/email, null when anonymous");
    table.string("reporter_language", 10).notNullable().defaultTo("en");

    table.specificType("category", "report_category").notNullable();
    table.text("description").notNullable();
    table.jsonb("symptoms").notNullable().defaultTo("[]").comment("Array of symptom codes/keywords");
    table.integer("affected_count").notNullable().defaultTo(1);

    table.string("address_text", 255).nullable();

    table.integer("severity_score").notNullable().defaultTo(0).comment("0-100 computed score");
    table.specificType("priority_level", "priority_level").notNullable().defaultTo("low");

    table.specificType("status", "report_status").notNullable().defaultTo("submitted");

    table.uuid("assigned_to").references("id").inTable("health_workers").nullable();
    table.uuid("incident_id").references("id").inTable("incidents").nullable();

    table.timestamp("sla_response_due_at", { useTz: true }).nullable();
    table.timestamp("sla_resolution_due_at", { useTz: true }).nullable();
    table.timestamp("triaged_at", { useTz: true }).nullable();
    table.timestamp("resolved_at", { useTz: true }).nullable();
    table.boolean("sla_response_breached").notNullable().defaultTo(false);
    table.boolean("sla_resolution_breached").notNullable().defaultTo(false);

    table.timestamps(true, true);
  });

  // Geospatial location, stored as geography(Point, 4326) — WGS84 lat/lng.
  await knex.raw(`ALTER TABLE reports ADD COLUMN location geography(Point, 4326) NULL`);
  await knex.raw(`CREATE INDEX idx_reports_location ON reports USING GIST (location)`);
  await knex.raw(`CREATE INDEX idx_reports_status ON reports (status)`);
  await knex.raw(`CREATE INDEX idx_reports_priority ON reports (priority_level)`);
  await knex.raw(`CREATE INDEX idx_reports_incident ON reports (incident_id)`);
  await knex.raw(`CREATE INDEX idx_reports_assigned_to ON reports (assigned_to)`);
  await knex.raw(`CREATE INDEX idx_reports_created_at ON reports (created_at)`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("reports");
  await knex.raw(`DROP TYPE IF EXISTS report_status`);
  await knex.raw(`DROP TYPE IF EXISTS report_category`);
}
