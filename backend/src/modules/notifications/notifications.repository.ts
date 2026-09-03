import { db } from "../../config/database";
import { Notification } from "../../types/domain";

export const notificationsRepository = {
  async create(data: Partial<Notification>): Promise<Notification> {
    const [row] = await db<Notification>("notifications").insert(data).returning("*");
    return row;
  },

  async markSent(id: string): Promise<void> {
    await db<Notification>("notifications").where({ id }).update({ status: "sent", sent_at: db.fn.now() });
  },

  async markFailed(id: string, reason: string): Promise<void> {
    await db<Notification>("notifications").where({ id }).update({ status: "failed", failure_reason: reason });
  },

  async findByReport(reportId: string): Promise<Notification[]> {
    return db<Notification>("notifications").where({ report_id: reportId }).orderBy("created_at", "desc");
  },
};
