export type TemplateName = "report_received" | "status_triaged" | "status_assigned" | "status_escalated" | "status_resolved" | "status_closed";

interface TemplateVars {
  reportToken?: string;
  status?: string;
}

// Minimal built-in multilingual templates (English + French shown as an
// example of the pattern). Extend per deployment locale; templates are
// intentionally short/plain-text to stay usable over low-bandwidth SMS.
const TEMPLATES: Record<TemplateName, Record<string, (vars: TemplateVars) => string>> = {
  report_received: {
    en: (v) => `Your health report was received. Reference code: ${v.reportToken}. You'll be notified as it's reviewed.`,
    fr: (v) => `Votre signalement de santé a été reçu. Code de référence : ${v.reportToken}. Vous serez informé de son suivi.`,
  },
  status_triaged: {
    en: (v) => `Update on report ${v.reportToken}: it has been reviewed and prioritized by a health worker.`,
    fr: (v) => `Mise à jour du signalement ${v.reportToken} : il a été examiné et classé par un agent de santé.`,
  },
  status_assigned: {
    en: (v) => `Update on report ${v.reportToken}: a health worker has been assigned to follow up.`,
    fr: (v) => `Mise à jour du signalement ${v.reportToken} : un agent de santé a été affecté au suivi.`,
  },
  status_escalated: {
    en: (v) => `Update on report ${v.reportToken}: your report has been escalated for urgent attention.`,
    fr: (v) => `Mise à jour du signalement ${v.reportToken} : votre signalement a été escaladé pour une attention urgente.`,
  },
  status_resolved: {
    en: (v) => `Update on report ${v.reportToken}: your report has been marked as resolved. Thank you for reporting.`,
    fr: (v) => `Mise à jour du signalement ${v.reportToken} : votre signalement a été résolu. Merci de votre signalement.`,
  },
  status_closed: {
    en: (v) => `Update on report ${v.reportToken}: your report has been closed.`,
    fr: (v) => `Mise à jour du signalement ${v.reportToken} : votre signalement a été clôturé.`,
  },
};

export function renderTemplate(template: TemplateName, language: string, vars: TemplateVars): string {
  const langTemplates = TEMPLATES[template];
  const renderer = langTemplates[language] ?? langTemplates.en;
  return renderer(vars);
}
