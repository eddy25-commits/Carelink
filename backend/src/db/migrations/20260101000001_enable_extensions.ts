import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"'); // gen_random_uuid()
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "postgis"'); // geography/geometry types + clustering
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP EXTENSION IF EXISTS "postgis"');
  await knex.raw('DROP EXTENSION IF EXISTS "pgcrypto"');
}
