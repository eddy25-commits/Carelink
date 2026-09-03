export const PRIORITY_LABELS = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const STATUS_LABELS = {
  submitted: "Submitted",
  triaged: "Triaged",
  assigned: "Assigned",
  in_progress: "In progress",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
};

export const CATEGORY_LABELS = {
  individual_symptom: "Individual symptom",
  suspected_outbreak: "Suspected outbreak",
  environmental_hazard: "Environmental hazard",
  other: "Other concern",
};

export const CATEGORY_DESCRIPTIONS = {
  individual_symptom: "One person is feeling unwell",
  suspected_outbreak: "Several people nearby are showing similar symptoms",
  environmental_hazard: "Contaminated water, sewage exposure, or a chemical concern",
  other: "Something else the team should know about",
};

export const SYMPTOM_OPTIONS = [
  { value: "fever", label: "Fever" },
  { value: "high_fever", label: "High fever" },
  { value: "cough", label: "Cough" },
  { value: "difficulty_breathing", label: "Difficulty breathing" },
  { value: "diarrhea", label: "Diarrhea" },
  { value: "persistent_vomiting", label: "Persistent vomiting" },
  { value: "dehydration", label: "Dehydration" },
  { value: "rash", label: "Rash" },
  { value: "headache", label: "Headache" },
  { value: "body_pain", label: "Body pain" },
  { value: "chest_pain", label: "Chest pain" },
  { value: "seizure", label: "Seizure" },
  { value: "unconscious", label: "Loss of consciousness" },
  { value: "severe_bleeding", label: "Severe bleeding" },
  { value: "snake_bite", label: "Snake bite" },
  { value: "suspected_poisoning", label: "Suspected poisoning" },
  { value: "contaminated_water", label: "Contaminated water" },
  { value: "sewage_exposure", label: "Sewage exposure" },
  { value: "chemical_exposure", label: "Chemical exposure" },
];

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];

// Mirrors the backend defaults in backend/.env.example — kept as client-side constants
// so the file picker can reject an oversized/invalid file before ever hitting the network.
export const MAX_ATTACHMENTS_PER_REPORT = 3;
export const MAX_ATTACHMENT_SIZE_MB = 5;
export const ALLOWED_ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function priorityBadgeClass(priority) {
  return `badge badge-${priority || "neutral"}`;
}

export function statusBadgeClass(status) {
  const map = {
    submitted: "badge-neutral",
    triaged: "badge-medium",
    assigned: "badge-medium",
    in_progress: "badge-high",
    escalated: "badge-critical",
    resolved: "badge-low",
    closed: "badge-neutral",
  };
  return `badge ${map[status] || "badge-neutral"}`;
}
