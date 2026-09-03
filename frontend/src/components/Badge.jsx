import { PRIORITY_LABELS, STATUS_LABELS, priorityBadgeClass, statusBadgeClass } from "../utils/constants";

export function PriorityBadge({ priority }) {
  return (
    <span className={priorityBadgeClass(priority)}>
      <span className="badge-dot" />
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={statusBadgeClass(status)}>
      <span className="badge-dot" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}
