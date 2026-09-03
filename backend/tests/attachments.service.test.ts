import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs/promises", () => ({
  default: { unlink: vi.fn().mockResolvedValue(undefined) },
  unlink: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../src/modules/reports/reports.repository", () => ({
  reportsRepository: {
    findById: vi.fn(),
  },
}));

vi.mock("../src/modules/attachments/attachments.repository", () => ({
  attachmentsRepository: {
    create: vi.fn(),
    countByReportId: vi.fn(),
  },
}));

import fs from "fs/promises";
import { attachmentsService } from "../src/modules/attachments/attachments.service";
import { reportsRepository } from "../src/modules/reports/reports.repository";
import { attachmentsRepository } from "../src/modules/attachments/attachments.repository";

const mockedFindById = vi.mocked(reportsRepository.findById);
const mockedCount = vi.mocked(attachmentsRepository.countByReportId);
const mockedCreate = vi.mocked(attachmentsRepository.create);
const mockedUnlink = vi.mocked(fs.unlink);

function makeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: "files",
    originalname: "photo.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    size: 1024,
    destination: "/tmp/uploads",
    filename: "generated-name.jpg",
    path: "/tmp/uploads/generated-name.jpg",
    buffer: Buffer.alloc(0),
    stream: undefined as never,
    ...overrides,
  };
}

describe("attachmentsService.attach", () => {
  beforeEach(() => {
    mockedFindById.mockReset();
    mockedCount.mockReset();
    mockedCreate.mockReset();
    mockedUnlink.mockClear();
    mockedCreate.mockImplementation(async (data) => ({
      id: "attachment-1",
      uploaded_at: new Date().toISOString(),
      ...data,
    }));
  });

  it("rejects and cleans up files when the report does not exist", async () => {
    mockedFindById.mockResolvedValue(undefined);
    const files = [makeFile()];

    await expect(attachmentsService.attach("missing-report", files)).rejects.toThrow(/not found/);
    expect(mockedUnlink).toHaveBeenCalledWith(files[0].path);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects and cleans up files once the per-report cap would be exceeded", async () => {
    mockedFindById.mockResolvedValue({ id: "report-1" } as never);
    mockedCount.mockResolvedValue(3); // MAX_ATTACHMENTS_PER_REPORT default is 3
    const files = [makeFile()];

    await expect(attachmentsService.attach("report-1", files)).rejects.toThrow(/limit is 3/);
    expect(mockedUnlink).toHaveBeenCalledWith(files[0].path);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("persists metadata for each accepted file", async () => {
    mockedFindById.mockResolvedValue({ id: "report-1" } as never);
    mockedCount.mockResolvedValue(0);
    const files = [makeFile({ filename: "a.jpg" }), makeFile({ filename: "b.pdf", mimetype: "application/pdf" })];

    const result = await attachmentsService.attach("report-1", files);

    expect(result).toHaveLength(2);
    expect(mockedCreate).toHaveBeenCalledTimes(2);
    expect(mockedUnlink).not.toHaveBeenCalled();
  });

  it("rejects an empty file list", async () => {
    await expect(attachmentsService.attach("report-1", [])).rejects.toThrow(/No files/);
  });
});
