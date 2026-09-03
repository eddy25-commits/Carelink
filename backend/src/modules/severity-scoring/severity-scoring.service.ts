import { PriorityLevel, ReportCategory } from "../../types/domain";

export interface SeverityInput {
  category: ReportCategory;
  symptoms: string[];
  description: string;
  affectedCount: number;
}

export interface SeverityResult {
  score: number; // 0-100
  priorityLevel: PriorityLevel;
  reasons: string[]; // human-readable rationale, useful for the triage dashboard
}

// Symptom weight table. Keys are lower-case, normalized symptom codes/keywords.
// Weights are additive and intentionally conservative — the goal is to
// surface likely-urgent reports for human review, not to auto-diagnose.
const SYMPTOM_WEIGHTS: Record<string, number> = {
  // High-acuity red flags
  difficulty_breathing: 35,
  chest_pain: 35,
  unconscious: 45,
  severe_bleeding: 40,
  seizure: 35,
  paralysis: 35,
  high_fever: 20,
  persistent_vomiting: 18,
  dehydration: 18,
  suspected_poisoning: 30,
  snake_bite: 35,
  // Moderate
  fever: 12,
  diarrhea: 10,
  rash: 8,
  headache: 6,
  body_pain: 5,
  cough: 8,
  fatigue: 4,
  // Environmental hazards
  contaminated_water: 22,
  disease_outbreak_suspected: 30,
  sewage_exposure: 18,
  chemical_exposure: 28,
};

const CATEGORY_BASE_SCORE: Record<ReportCategory, number> = {
  suspected_outbreak: 25,
  environmental_hazard: 15,
  individual_symptom: 5,
  other: 0,
};

// Free-text keyword scan as a fallback signal when structured symptom
// codes are absent (e.g. a low-literacy reporter typed a short sentence).
const KEYWORD_SIGNALS: Array<{ pattern: RegExp; weight: number; label: string }> = [
  { pattern: /can'?t breathe|breathless|struggling to breathe/i, weight: 30, label: "breathing difficulty mentioned" },
  { pattern: /unconscious|not waking up|passed out/i, weight: 40, label: "loss of consciousness mentioned" },
  { pattern: /blood|bleeding/i, weight: 20, label: "bleeding mentioned" },
  { pattern: /outbreak|many people sick|several people|multiple people/i, weight: 25, label: "possible outbreak mentioned" },
  { pattern: /dying|dead|died/i, weight: 30, label: "death/critical outcome mentioned" },
  { pattern: /pregnant/i, weight: 12, label: "pregnancy — treat with elevated caution" },
  { pattern: /child|infant|baby/i, weight: 8, label: "pediatric case — treat with elevated caution" },
];

function scoreToPriority(score: number): PriorityLevel {
  if (score >= 70) return "critical";
  if (score >= 45) return "high";
  if (score >= 20) return "medium";
  return "low";
}

/**
 * Computes an automated severity score (0-100) and priority level for a
 * newly submitted health report. This is a deliberately transparent,
 * rule-based scorer (not a black-box model) so triage officers can see
 * and trust *why* a report was prioritized the way it was — each
 * contributing factor is returned in `reasons`.
 */
export function computeSeverity(input: SeverityInput): SeverityResult {
  const reasons: string[] = [];
  let score = CATEGORY_BASE_SCORE[input.category] ?? 0;
  if (score > 0) reasons.push(`Base score for category "${input.category}": +${score}`);

  const normalizedSymptoms = new Set(input.symptoms.map((s) => s.trim().toLowerCase()));
  for (const symptom of normalizedSymptoms) {
    const weight = SYMPTOM_WEIGHTS[symptom];
    if (weight) {
      score += weight;
      reasons.push(`Symptom "${symptom}": +${weight}`);
    }
  }

  for (const signal of KEYWORD_SIGNALS) {
    if (signal.pattern.test(input.description)) {
      score += signal.weight;
      reasons.push(`${signal.label}: +${signal.weight}`);
    }
  }

  // Scale severity with the number of people affected — a cluster of
  // affected individuals should not be scored the same as a single case.
  if (input.affectedCount > 1) {
    const affectedBonus = Math.min(20, (input.affectedCount - 1) * 4);
    score += affectedBonus;
    reasons.push(`${input.affectedCount} people affected: +${affectedBonus}`);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    priorityLevel: scoreToPriority(score),
    reasons,
  };
}
