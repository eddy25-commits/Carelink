import { describe, it, expect, vi, beforeEach } from "vitest";
import { Report } from "../src/types/domain";

vi.mock("../src/modules/reports/reports.repository", () => ({
  reportsRepository: {
    findById: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock("../src/modules/triage/triage-actions.repository", () => ({
  triageActionsRepository: {
    create: vi.fn(),
    findByReport: vi.fn(),
  },
}));

vi.mock("../src/modules/notifications/notifications.service", () => ({
  notificationsService: {
    notifyReporter: vi.fn().mockResolvedValue(undefined),
  },
}));

import { triageService } from "../src/modules/triage/triage.service";
import { reportsRepository } from "../src/modules/reports/reports.repository";
import { triageActionsRepository } from "../src/modules/triage/triage-actions.repository";

const mockedFindById = vi.mocked(reportsRepository.findById);
const mockedUpdateStatus = vi.mocked(reportsRepository.updateStatus);
const mockedCreateAction = vi.mocked(triageActionsRepository.create);

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: "report-1",
    report_token: "ABC123",
    is_anonymous: true,
    reporter_contact: null,
    reporter_language: "en",
    category: "individual_symptom",
    description: "Test report",
    symptoms: [],
    affected_count: 1,
    address_text: null,
    latitude: null,
    longitude: null,
    severity_score: 10,
    priority_level: "low",
    status: "submitted",
    assigned_to: null,
    incident_id: null,
    sla_response_due_at: null,
    sla_resolution_due_at: null,
    sla_response_breached: false,
    sla_resolution_breached: false,
    triaged_at: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("triageService state machine", () => {
  beforeEach(() => {
    mockedFindById.mockReset();
    mockedUpdateStatus.mockReset();
    mockedCreateAction.mockReset();
    mockedCreateAction.mockResolvedValue({} as never);
  });

  it("moves a submitted report to triaged", async () => {
    const report = makeReport({ status: "submitted" });
    mockedFindById.mockResolvedValue(report);
    mockedUpdateStatus.mockResolvedValue({ ...report, status: "triaged" });

    const result = await triageService.triage("report-1", "worker-1", "Looks routine");

    expect(result.status).toBe("triaged");
    expect(mockedUpdateStatus).toHaveBeenCalledWith(
      "report-1",
      expect.objectContaining({ status: "triaged" })
    );
    expect(mockedCreateAction).toHaveBeenCalledWith(
      expect.objectContaining({ action_type: "triage", previous_status: "submitted", new_status: "triaged" })
    );
  });

  it("rejects triaging a report that is already resolved", async () => {
    mockedFindById.mockResolvedValue(makeReport({ status: "resolved" }));

    await expect(triageService.triage("report-1", "worker-1")).rejects.toThrow(/Cannot perform "triage"/);
    expect(mockedUpdateStatus).not.toHaveBeenCalled();
  });

  it("assigns an unassigned report and reassigns an already-assigned one", async () => {
    const unassigned = makeReport({ status: "triaged", assigned_to: null });
    mockedFindById.mockResolvedValue(unassigned);
    mockedUpdateStatus.mockResolvedValue({ ...unassigned, status: "assigned", assigned_to: "worker-2" });

    await triageService.assign("report-1", "worker-1", "worker-2");
    expect(mockedCreateAction).toHaveBeenCalledWith(expect.objectContaining({ action_type: "assign" }));

    const assigned = makeReport({ status: "assigned", assigned_to: "worker-2" });
    mockedFindById.mockResolvedValue(assigned);
    mockedUpdateStatus.mockResolvedValue({ ...assigned, assigned_to: "worker-3" });

    await triageService.assign("report-1", "worker-1", "worker-3");
    expect(mockedCreateAction).toHaveBeenCalledWith(expect.objectContaining({ action_type: "reassign" }));
  });

  it("requires a resolved report before it can be closed", async () => {
    mockedFindById.mockResolvedValue(makeReport({ status: "assigned" }));
    await expect(triageService.close("report-1", "worker-1")).rejects.toThrow(/Cannot perform "close"/);

    mockedFindById.mockResolvedValue(makeReport({ status: "resolved" }));
    mockedUpdateStatus.mockResolvedValue(makeReport({ status: "closed" }));
    const closed = await triageService.close("report-1", "worker-1");
    expect(closed.status).toBe("closed");
  });

  it("reopens a closed report back into in_progress and clears the resolved timestamp", async () => {
    mockedFindById.mockResolvedValue(makeReport({ status: "closed", resolved_at: new Date().toISOString() }));
    mockedUpdateStatus.mockResolvedValue(makeReport({ status: "in_progress", resolved_at: null }));

    const result = await triageService.reopen("report-1", "worker-1", "New information came in");

    expect(result.status).toBe("in_progress");
    expect(mockedUpdateStatus).toHaveBeenCalledWith(
      "report-1",
      expect.objectContaining({ status: "in_progress", resolved_at: null })
    );
  });

  it("records a comment without changing the report status", async () => {
    const report = makeReport({ status: "assigned" });
    mockedFindById.mockResolvedValue(report);

    const result = await triageService.comment("report-1", "worker-1", "Following up tomorrow");

    expect(result.status).toBe("assigned");
    expect(mockedUpdateStatus).not.toHaveBeenCalled();
    expect(mockedCreateAction).toHaveBeenCalledWith(
      expect.objectContaining({ action_type: "comment", notes: "Following up tomorrow" })
    );
  });

  it("throws NotFoundError for an unknown report id", async () => {
    mockedFindById.mockResolvedValue(undefined);
    await expect(triageService.triage("missing-report", "worker-1")).rejects.toThrow(/not found/);
  });
});
