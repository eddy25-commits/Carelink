import fs from "fs";
import path from "path";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import { env } from "../config/env";
import { PayloadTooLargeError, ValidationError } from "../utils/errors";

// Photos of a symptom/hazard, or a PDF (e.g. a scanned clinic note) — the
// realistic evidence types a low-resource community reporter can attach.
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

function uploadRoot(): string {
  return path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.join(process.cwd(), env.UPLOAD_DIR);
}

/** Absolute path to where a given report's attachments are stored on disk. */
export function reportUploadDir(reportId: string): string {
  return path.join(uploadRoot(), "reports", reportId);
}

const storage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const dir = reportUploadDir(req.params.reportId);
    fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
  },
  filename: (_req, file, cb) => {
    const ext = EXTENSION_BY_MIME[file.mimetype] ?? path.extname(file.originalname).slice(0, 10);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new ValidationError(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WEBP, PDF.`));
    return;
  }
  cb(null, true);
}

const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_ATTACHMENT_SIZE_MB * 1024 * 1024,
    files: env.MAX_ATTACHMENTS_PER_REPORT,
  },
});

/**
 * Accepts up to MAX_ATTACHMENTS_PER_REPORT files under the "files" field,
 * translating Multer's raw errors into the app's standard error shape.
 */
export function uploadAttachmentFiles(req: Request, res: Response, next: NextFunction): void {
  const handler = multerUpload.array("files", env.MAX_ATTACHMENTS_PER_REPORT);
  handler(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        next(new PayloadTooLargeError(`Each file must be under ${env.MAX_ATTACHMENT_SIZE_MB}MB.`));
        return;
      }
      if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
        next(new ValidationError(`You can attach at most ${env.MAX_ATTACHMENTS_PER_REPORT} files.`));
        return;
      }
      next(new ValidationError(err.message));
      return;
    }
    next(err);
  });
}
