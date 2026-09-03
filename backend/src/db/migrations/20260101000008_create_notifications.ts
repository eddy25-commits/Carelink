import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TYPE notification_channel AS ENUM ('sms', 'push', 'in_app')
  `);
  await knex.raw(`
    CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed')
  `);

  await knex.schema.createTable("notifications", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("report_id").notNullable().references("id").inTable("reports").onDelete("CASCADE");
    table.specificType("channel", "notification_channel").notNullable().defaultTo("in_app");
    table.string("recipient", 150).notNullable();
    table.string("template", 100).notNullable().comment("e.g. report_received, status_update, escalated");
    table.text("message").notNullable();
    table.string("language", 10).notNullable().defaultTo("en");
    table.specificType("status", "notification_status").notNullable().defaultTo("pending");
    table.text("failure_reason").nullable();
    table.timestamp("sent_at", { useTz: true }).nullable();
    table.timestamps(true, true);
  });

  await knex.raw(`CREATE INDEX idx_notifications_report ON notifications (report_id)`);
  await knex.raw(`CREATE INDEX idx_notifications_status ON notifications (status)`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("notifications");
  await knex.raw(`DROP TYPE IF EXISTS notification_channel`);
  await knex.raw(`DROP TYPE IF EXISTS notification_status`);
}
