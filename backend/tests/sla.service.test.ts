import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/modules/sla-policies/sla-policies.repository", () => ({
  slaPoliciesRepository: {
    findByPriority: vi.fn(),
  },
}));

import { slaService } from "../src/modules/sla-policies/sla.service";
import { slaPoliciesRepository } from "../src/modules/sla-policies/sla-policies.repository";

const mockedFindByPriority = vi.mocked(slaPoliciesRepository.findByPriority);

describe("slaService.computeDueDates", () => {
  beforeEach(() => {
    mockedFindByPriority.mockReset();
  });

  it("computes response and resolution due dates from the priority's policy", async () => {
    mockedFindByPriority.mockResolvedValue({
      id: "policy-1",
      priority_level: "critical",
      response_minutes: 15,
      resolution_minutes: 120,
      is_active: true,
    });

    const from = new Date("2026-01-01T00:00:00.000Z");
    const result = await slaService.computeDueDates("critical", from);

    expect(result.responseDueAt.toISOString()).toBe("2026-01-01T00:15:00.000Z");
    expect(result.resolutionDueAt.toISOString()).toBe("2026-01-01T02:00:00.000Z");
  });

  it("gives low-priority reports a longer runway than critical ones", async () => {
    const from = new Date("2026-01-01T00:00:00.000Z");

    mockedFindByPriority.mockResolvedValueOnce({
      id: "p-critical",
      priority_level: "critical",
      response_minutes: 15,
      resolution_minutes: 120,
      is_active: true,
    });
    const critical = await slaService.computeDueDates("critical", from);

    mockedFindByPriority.mockResolvedValueOnce({
      id: "p-low",
      priority_level: "low",
      response_minutes: 1440,
      resolution_minutes: 4320,
      is_active: true,
    });
    const low = await slaService.computeDueDates("low", from);

    expect(low.responseDueAt.getTime()).toBeGreaterThan(critical.responseDueAt.getTime());
    expect(low.resolutionDueAt.getTime()).toBeGreaterThan(critical.resolutionDueAt.getTime());
  });

  it("throws when no policy is configured for the priority level", async () => {
    mockedFindByPriority.mockResolvedValue(undefined);
    await expect(slaService.computeDueDates("medium")).rejects.toThrow(/SLA policy/);
  });
});
