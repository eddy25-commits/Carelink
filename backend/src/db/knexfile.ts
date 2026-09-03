import type { Knex } from "knex";
import "dotenv/config";

// Standalone knexfile used only by the Knex CLI (migrate/seed commands).
// The application itself uses src/config/database.ts.
const config: Knex.Config = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  pool: { min: 2, max: 10 },
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

export default config;
