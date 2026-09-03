import { db } from "../../config/database";
import { ReportAttachment } from "../../types/domain";

export interface CreateAttachmentRow {
  report_id: string;
  file_url: string;
  file_type: string;
  file_size_bytes: number;
}

export const attachmentsRepository = {
  async create(data: CreateAttachmentRow): Promise<ReportAttachment> {
    const [row] = await db("report_attachments").insert(data).returning("*");
    return row;
  },

  async findByReportId(reportId: string): Promise<ReportAttachment[]> {
    return db("report_attachments").where({ report_id: reportId }).orderBy("uploaded_at", "asc");
  },

  async findById(id: string): Promise<ReportAttachment | undefined> {
    return db("report_attachments").where({ id }).first();
  },

  async countByReportId(reportId: string): Promise<number> {
    const [{ count }] = await db("report_attachments").where({ report_id: reportId }).count<{ count: string }[]>(
      "id as count"
    );
    return Number(count);
  },
};
