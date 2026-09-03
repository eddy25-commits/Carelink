import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TYPE health_worker_role AS ENUM ('field_worker', 'triage_officer', 'supervisor', 'admin')
  `);

  await knex.schema.createTable("health_workers", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("full_name", 150).notNullable();
    table.string("email", 255).notNullable().unique();
    table.string("password_hash", 255).notNullable();
    table.specificType("role", "health_worker_role").notNullable().defaultTo("field_worker");
    table.string("language", 10).notNullable().defaultTo("en");
    table.string("district", 150).nullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("last_login_at", { useTz: true }).nullable();
    table.timestamps(true, true);
  });

  await knex.schema.raw(`CREATE INDEX idx_health_workers_role ON health_workers (role)`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("health_workers");
  await knex.raw(`DROP TYPE IF EXISTS health_worker_role`);
}
