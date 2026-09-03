export function formatDateTime(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeDue(value) {
  if (!value) return "No deadline set";
  const target = new Date(value).getTime();
  const now = Date.now();
  const diffMs = target - now;
  const absMinutes = Math.round(Math.abs(diffMs) / 60000);

  if (absMinutes < 1) return diffMs >= 0 ? "Due now" : "Just passed";

  const unit = (count, label) => `${count} ${label}${count === 1 ? "" : "s"}`;

  let text;
  if (absMinutes < 60) {
    text = unit(absMinutes, "minute");
  } else if (absMinutes < 60 * 24) {
    text = unit(Math.round(absMinutes / 60), "hour");
  } else {
    text = unit(Math.round(absMinutes / (60 * 24)), "day");
  }

  return diffMs >= 0 ? `Due in ${text}` : `Overdue by ${text}`;
}

export function initials(fullName) {
  if (!fullName) return "?";
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}
