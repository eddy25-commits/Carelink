import { describe, it, expect } from "vitest";
import { computeSeverity } from "../src/modules/severity-scoring/severity-scoring.service";

describe("computeSeverity", () => {
  it("scores a minor single-symptom report as low priority", () => {
    const result = computeSeverity({
      category: "individual_symptom",
      symptoms: ["headache"],
      description: "Mild headache since this morning.",
      affectedCount: 1,
    });

    expect(result.priorityLevel).toBe("low");
    expect(result.score).toBeLessThan(20);
  });

  it("scores a report with breathing difficulty as critical", () => {
    const result = computeSeverity({
      category: "individual_symptom",
      symptoms: ["difficulty_breathing", "chest_pain"],
      description: "Patient can't breathe properly and is in pain.",
      affectedCount: 1,
    });

    expect(result.priorityLevel).toBe("critical");
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it("increases score with number of people affected", () => {
    const single = computeSeverity({
      category: "suspected_outbreak",
      symptoms: ["fever", "diarrhea"],
      description: "A few people feeling unwell.",
      affectedCount: 1,
    });
    const many = computeSeverity({
      category: "suspected_outbreak",
      symptoms: ["fever", "diarrhea"],
      description: "Many people feeling unwell.",
      affectedCount: 15,
    });

    expect(many.score).toBeGreaterThan(single.score);
  });

  it("never exceeds a score of 100", () => {
    const result = computeSeverity({
      category: "suspected_outbreak",
      symptoms: ["unconscious", "severe_bleeding", "difficulty_breathing", "seizure"],
      description: "Multiple people dying, unconscious, bleeding heavily, can't breathe, outbreak suspected.",
      affectedCount: 500,
    });

    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.priorityLevel).toBe("critical");
  });
});
