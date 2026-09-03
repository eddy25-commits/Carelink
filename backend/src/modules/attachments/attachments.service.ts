import fs from "fs/promises";
import path from "path";
import { reportsRepository } from "../reports/reports.repository";
import { attachmentsRepository } from "./attachments.repository";
import { env } from "../../config/env";
import { ConflictError, NotFoundError, ValidationError } from "../../utils/errors";
import { ReportAttachment } from "../../types/domain";
import { logger } from "../../config/logger";

async function deleteFiles(files: Express.Multer.File[]): Promise<void> {
  await Promise.all(
    files.map((file) =>
      fs.unlink(file.path).catch((err) => logger.warn({ err, path: file.path }, "Failed to clean up upload"))
    )
  );
}

export const attachmentsService = {
  /**
   * Persists metadata for files Multer has already written to disk under
   * this report's upload folder. Rejects (and cleans up the just-written
   * files) if the report doesn't exist or the per-report cap is exceeded,
   * so a bad/guessed report id can't be used to fill disk space.
   */
  async attach(reportId: string, files: Express.Multer.File[]): Promise<ReportAttachment[]> {
    if (files.length === 0) {
      throw new ValidationError("No files were received. Attach at least one file.");
    }

    const report = await reportsRepository.findById(reportId);
    if (!report) {
      await deleteFiles(files);
      throw new NotFoundError("Report");
    }

    const existingCount = await attachmentsRepository.countByReportId(reportId);
    if (existingCount + files.length > env.MAX_ATTACHMENTS_PER_REPORT) {
      await deleteFiles(files);
      throw new ConflictError(
        `This report already has ${existingCount} attachment(s); the limit is ${env.MAX_ATTACHMENTS_PER_REPORT}.`
      );
    }

    return Promise.all(
      files.map((file) =>
        attachmentsRepository.create({
          report_id: reportId,
          file_url: path.relative(process.cwd(), file.path).split(path.sep).join("/"),
          file_type: file.mimetype,
          file_size_bytes: file.size,
        })
      )
    );
  },

  async listForReport(reportId: string): Promise<ReportAttachment[]> {
    const report = await reportsRepository.findById(reportId);
    if (!report) throw new NotFoundError("Report");
    return attachmentsRepository.findByReportId(reportId);
  },

  /** Resolves an attachment to an absolute on-disk path, scoped to the given report. */
  async resolveFile(reportId: string, attachmentId: string): Promise<{ absolutePath: string; mimeType: string }> {
    const attachment = await attachmentsRepository.findById(attachmentId);
    if (!attachment || attachment.report_id !== reportId) {
      throw new NotFoundError("Attachment");
    }
    return {
      absolutePath: path.join(process.cwd(), attachment.file_url),
      mimeType: attachment.file_type,
    };
  },
};
