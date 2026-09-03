export type HealthWorkerRole = "field_worker" | "triage_officer" | "supervisor" | "admin";

export type ReportCategory = "individual_symptom" | "suspected_outbreak" | "environmental_hazard" | "other";

export type ReportStatus =
  | "submitted"
  | "triaged"
  | "assigned"
  | "in_progress"
  | "escalated"
  | "resolved"
  | "closed";

export type PriorityLevel = "critical" | "high" | "medium" | "low";

export type TriageActionType =
  | "triage"
  | "assign"
  | "reassign"
  | "escalate"
  | "comment"
  | "resolve"
  | "close"
  | "reopen";

export type IncidentStatus = "active" | "monitoring" | "resolved";

export type NotificationChannel = "sms" | "push" | "in_app";
export type NotificationStatus = "pending" | "sent" | "failed";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface HealthWorker {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: HealthWorkerRole;
  language: string;
  district: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  report_token: string;
  is_anonymous: boolean;
  reporter_contact: string | null;
  reporter_language: string;
  category: ReportCategory;
  description: string;
  symptoms: string[];
  affected_count: number;
  address_text: string | null;
  latitude: number | null;
  longitude: number | null;
  severity_score: number;
  priority_level: PriorityLevel;
  status: ReportStatus;
  assigned_to: string | null;
  incident_id: string | null;
  sla_response_due_at: string | null;
  sla_resolution_due_at: string | null;
  sla_response_breached: boolean;
  sla_resolution_breached: boolean;
  triaged_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TriageAction {
  id: string;
  report_id: string;
  actor_id: string | null;
  action_type: TriageActionType;
  previous_status: ReportStatus | null;
  new_status: ReportStatus | null;
  notes: string | null;
  created_at: string;
}

export interface Incident {
  id: string;
  name: string;
  description: string | null;
  status: IncidentStatus;
  severity_level: PriorityLevel;
  report_count: number;
  radius_meters: number;
  latitude: number;
  longitude: number;
  first_report_at: string | null;
  last_report_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  report_id: string;
  channel: NotificationChannel;
  recipient: string;
  template: string;
  message: string;
  language: string;
  status: NotificationStatus;
  failure_reason: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface ReportAttachment {
  id: string;
  report_id: string;
  file_url: string;
  file_type: string;
  file_size_bytes: number;
  uploaded_at: string;
}

export interface SlaPolicy {
  id: string;
  priority_level: PriorityLevel;
  response_minutes: number;
  resolution_minutes: number;
  is_active: boolean;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: HealthWorkerRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
