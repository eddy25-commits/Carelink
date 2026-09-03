import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TYPE triage_action_type AS ENUM (
      'triage', 'assign', 'reassign', 'escalate', 'comment', 'resolve', 'close', 'reopen'
    )
  `);

  await knex.schema.createTable("triage_actions", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("report_id").notNullable().references("id").inTable("reports").onDelete("CASCADE");
    table.uuid("actor_id").references("id").inTable("health_workers").nullable();
    table.specificType("action_type", "triage_action_type").notNullable();
    table.specificType("previous_status", "report_status").nullable();
    table.specificType("new_status", "report_status").nullable();
    table.text("notes").nullable();
    table.timestamps(true, true);
  });

  await knex.raw(`CREATE INDEX idx_triage_actions_report ON triage_actions (report_id)`);
  await knex.raw(`CREATE INDEX idx_triage_actions_created_at ON triage_actions (created_at)`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("triage_actions");
  await knex.raw(`DROP TYPE IF EXISTS triage_action_type`);
}
