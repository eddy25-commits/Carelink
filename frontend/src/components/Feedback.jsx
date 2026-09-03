export function LoadingBlock({ label = "Loading" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "60px 20px" }}>
      <span className="spinner spinner-lg" aria-hidden="true" />
      <p style={{ color: "#5c6b85", fontWeight: 500 }}>{label}</p>
    </div>
  );
}

export function EmptyState({ icon = "\u2728", title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" style={{ fontSize: 22 }}>
        {icon}
      </div>
      <h3 style={{ fontSize: "1.1rem", color: "var(--navy-900)" }}>{title}</h3>
      {description && <p style={{ maxWidth: 380 }}>{description}</p>}
    </div>
  );
}

export function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="alert alert-error" role="alert">
      <span aria-hidden="true">{"\u26A0"}</span>
      <span>{message}</span>
    </div>
  );
}

export function SuccessAlert({ message }) {
  if (!message) return null;
  return (
    <div className="alert alert-success" role="status">
      <span aria-hidden="true">{"\u2713"}</span>
      <span>{message}</span>
    </div>
  );
}
