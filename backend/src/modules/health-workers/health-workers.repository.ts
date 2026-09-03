import { db } from "../../config/database";
import { HealthWorker, HealthWorkerRole } from "../../types/domain";

export const healthWorkersRepository = {
  async findByEmail(email: string): Promise<HealthWorker | undefined> {
    return db<HealthWorker>("health_workers").where({ email: email.toLowerCase() }).first();
  },

  async findById(id: string): Promise<HealthWorker | undefined> {
    return db<HealthWorker>("health_workers").where({ id }).first();
  },

  async findActiveByRole(roles: string[]): Promise<HealthWorker[]> {
    return db<HealthWorker>("health_workers").whereIn("role", roles).andWhere({ is_active: true }).select("*");
  },

  async list(params: { district?: string; role?: HealthWorkerRole; isActive?: boolean }): Promise<HealthWorker[]> {
    const query = db<HealthWorker>("health_workers").select("*").orderBy("full_name", "asc");
    if (params.district) query.andWhere({ district: params.district });
    if (params.role) query.andWhere({ role: params.role });
    if (params.isActive !== undefined) query.andWhere({ is_active: params.isActive });
    return query;
  },

  async create(data: Partial<HealthWorker>): Promise<HealthWorker> {
    const [row] = await db<HealthWorker>("health_workers").insert(data).returning("*");
    return row;
  },

  async touchLastLogin(id: string): Promise<void> {
    await db<HealthWorker>("health_workers").where({ id }).update({ last_login_at: db.fn.now() });
  },
};
