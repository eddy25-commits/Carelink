import { useState } from "react";

export default function PasswordInput({ id, value, onChange, placeholder, autoComplete, required }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        id={id}
        type={visible ? "text" : "password"}
        className="input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        tabIndex={0}
      >
        {visible ? (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 3l18 18M10.6 10.6a2.5 2.5 0 003.53 3.53M6.7 6.7C4.35 8.2 2.7 10.35 2 12c1.3 3.1 5 7 10 7 1.77 0 3.4-.47 4.8-1.24M9.9 4.3A10.9 10.9 0 0112 4c5 0 8.7 3.9 10 7a12.8 12.8 0 01-2.16 3.36"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M2 12c1.3-3.1 5-7 10-7s8.7 3.9 10 7c-1.3 3.1-5 7-10 7s-8.7-3.9-10-7z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        )}
      </button>
    </div>
  );
}