import type { Knex } from "knex";
import bcrypt from "bcryptjs";

export async function seed(knex: Knex): Promise<void> {
  await knex("health_workers").del();

  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);

  await knex("health_workers").insert([
    {
      full_name: "System Administrator",
      email: "admin@healthtriage.local",
      password_hash: passwordHash,
      role: "admin",
      district: "Central District",
    },
    {
      full_name: "Ama Serwaa",
      email: "triage.officer@healthtriage.local",
      password_hash: passwordHash,
      role: "triage_officer",
      district: "Central District",
    },
    {
      full_name: "Kojo Mensah",
      email: "field.worker@healthtriage.local",
      password_hash: passwordHash,
      role: "field_worker",
      district: "Central District",
    },
  ]);
}
