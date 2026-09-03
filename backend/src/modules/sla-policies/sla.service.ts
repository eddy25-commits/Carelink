import { PriorityLevel } from "../../types/domain";
import { slaPoliciesRepository } from "./sla-policies.repository";
import { NotFoundError } from "../../utils/errors";

export interface SlaDueDates {
  responseDueAt: Date;
  resolutionDueAt: Date;
}

export const slaService = {
  /**
   * Given a priority level, looks up the configured SLA policy and
   * returns the absolute due dates (from now) for first response and
   * full resolution. Policies live in the database so they can be
   * tuned per-deployment/environment without a code change.
   */
  async computeDueDates(priorityLevel: PriorityLevel, from: Date = new Date()): Promise<SlaDueDates> {
    const policy = await slaPoliciesRepository.findByPriority(priorityLevel);
    if (!policy) {
      throw new NotFoundError(`SLA policy for priority "${priorityLevel}"`);
    }

    return {
      responseDueAt: new Date(from.getTime() + policy.response_minutes * 60_000),
      resolutionDueAt: new Date(from.getTime() + policy.resolution_minutes * 60_000),
    };
  },
};
