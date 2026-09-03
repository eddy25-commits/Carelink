import knex, { Knex } from "knex";
import { env } from "./env";
import { logger } from "./logger";

const config: Knex.Config = {
  client: "pg",
  connection: env.DATABASE_URL,
  pool: { min: env.DB_POOL_MIN, max: env.DB_POOL_MAX },
  migrations: {
    directory: "./migrations",
    extension: "ts",
    tableName: "knex_migrations",
  },
  seeds: {
    directory: "./seeds",
    extension: "ts",
  },
};

export const db: Knex = knex(config);

export async function checkDatabaseConnection(): Promise<void> {
  try {
    await db.raw("select 1+1 as result");
    logger.info("Database connection established");
  } catch (err) {
    logger.error({ err }, "Failed to connect to the database");
    throw err;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  await db.destroy();
}
