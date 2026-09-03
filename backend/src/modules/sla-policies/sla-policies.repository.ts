import { db } from "../../config/database";
import { PriorityLevel, SlaPolicy } from "../../types/domain";

export const slaPoliciesRepository = {
  async findAll(): Promise<SlaPolicy[]> {
    return db<SlaPolicy>("sla_policies").where({ is_active: true }).select("*");
  },

  async findByPriority(priorityLevel: PriorityLevel): Promise<SlaPolicy | undefined> {
    return db<SlaPolicy>("sla_policies").where({ priority_level: priorityLevel, is_active: true }).first();
  },
};
