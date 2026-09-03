import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("report_attachments", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("report_id").notNullable().references("id").inTable("reports").onDelete("CASCADE");
    table.string("file_url", 500).notNullable();
    table.string("file_type", 50).notNullable();
    table.integer("file_size_bytes").notNullable();
    table.timestamp("uploaded_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`CREATE INDEX idx_report_attachments_report ON report_attachments (report_id)`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("report_attachments");
}
