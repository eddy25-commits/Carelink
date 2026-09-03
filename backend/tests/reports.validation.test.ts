import { describe, it, expect } from "vitest";
import { createReportSchema } from "../src/modules/reports/reports.validation";

const validBase = {
  category: "individual_symptom" as const,
  description: "Persistent fever for two days",
};

describe("createReportSchema", () => {
  it("accepts a minimal valid report and applies defaults", () => {
    const result = createReportSchema.parse(validBase);

    expect(result.isAnonymous).toBe(false);
    expect(result.reporterLanguage).toBe("en");
    expect(result.affectedCount).toBe(1);
    expect(result.symptoms).toEqual([]);
  });

  it("rejects a description that is too short to be useful", () => {
    expect(() => createReportSchema.parse({ ...validBase, description: "Hi" })).toThrow();
  });

  it("rejects an unknown category", () => {
    expect(() => createReportSchema.parse({ ...validBase, category: "not_a_real_category" })).toThrow();
  });

  it("rejects out-of-range geographic coordinates", () => {
    expect(() =>
      createReportSchema.parse({ ...validBase, location: { latitude: 200, longitude: 10 } })
    ).toThrow();
  });

  it("accepts valid coordinates", () => {
    const result = createReportSchema.parse({
      ...validBase,
      location: { latitude: 5.6, longitude: -0.2 },
    });
    expect(result.location).toEqual({ latitude: 5.6, longitude: -0.2 });
  });

  it("caps affectedCount at the configured maximum", () => {
    expect(() => createReportSchema.parse({ ...validBase, affectedCount: 999999 })).toThrow();
  });

  it("caps the number of symptoms accepted per report", () => {
    const symptoms = Array.from({ length: 31 }, (_, i) => `symptom_${i}`);
    expect(() => createReportSchema.parse({ ...validBase, symptoms })).toThrow();
  });
});
