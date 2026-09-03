import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TYPE priority_level AS ENUM ('critical', 'high', 'medium', 'low')
  `);

  await knex.schema.createTable("sla_policies", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.specificType("priority_level", "priority_level").notNullable().unique();
    table.integer("response_minutes").notNullable().comment("Time allowed for a worker to acknowledge/triage");
    table.integer("resolution_minutes").notNullable().comment("Time allowed to fully resolve the report");
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);
  });

  // Default, environment-configurable SLA thresholds by priority.
  await knex("sla_policies").insert([
    { priority_level: "critical", response_minutes: 15, resolution_minutes: 120 },
    { priority_level: "high", response_minutes: 60, resolution_minutes: 480 },
    { priority_level: "medium", response_minutes: 240, resolution_minutes: 1440 },
    { priority_level: "low", response_minutes: 1440, resolution_minutes: 4320 },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("sla_policies");
  await knex.raw(`DROP TYPE IF EXISTS priority_level`);
}
