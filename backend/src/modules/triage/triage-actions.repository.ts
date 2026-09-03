import { db } from "../../config/database";
import { TriageAction } from "../../types/domain";

export const triageActionsRepository = {
  async create(data: Partial<TriageAction>): Promise<TriageAction> {
    const [row] = await db<TriageAction>("triage_actions").insert(data).returning("*");
    return row;
  },

  async findByReport(reportId: string): Promise<TriageAction[]> {
    return db<TriageAction>("triage_actions").where({ report_id: reportId }).orderBy("created_at", "asc");
  },
};
