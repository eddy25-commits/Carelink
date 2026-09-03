import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import { initials } from "../utils/formatters";
import InstallAppButton from "./InstallAppButton";

const LANGUAGE_LABELS = { en: "EN", fr: "FR" };

function LanguageSwitcher({ className }) {
  const { language, setLanguage, availableLanguages } = useLanguage();
  if (availableLanguages.length < 2) return null;

  return (
    <div className={className} role="group" aria-label="Choose language">
      {availableLanguages.map((code) => (
        <button
          key={code}
          type="button"
          className={`btn btn-ghost btn-sm ${language === code ? "active" : ""}`}
          aria-pressed={language === code}
          onClick={() => setLanguage(code)}
        >
          {LANGUAGE_LABELS[code] || code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function Navbar() {
  const { isAuthenticated, worker, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const links = [
    { to: "/report", label: t("nav.reportConcern") },
    { to: "/track", label: t("nav.trackReport") },
    ...(isAuthenticated
      ? [
          { to: "/dashboard", label: t("nav.triageQueue") },
          { to: "/incidents", label: t("nav.incidents") },
          ...(worker?.role === "admin" ? [{ to: "/admin", label: t("nav.admin") }] : []),
        ]
      : []),
  ];

  return (
    <header className="navbar-wrap">
      <nav className="navbar glass-strong">
        <Link to="/" className="navbar-brand">
          <span className="navbar-brand-mark">+</span>
          <span>CareLink</span>
        </Link>

        <div className="navbar-links">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={isActive(link.to) ? "navbar-link active" : "navbar-link"}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          <LanguageSwitcher className="navbar-lang" />
          <InstallAppButton />
          {isAuthenticated ? (
            <div className="navbar-user">
              <span className="navbar-avatar">{initials(worker?.full_name)}</span>
              <div className="navbar-user-meta">
                <strong>{worker?.full_name}</strong>
                <span>{worker?.role?.replace(/_/g, " ")}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                {t("nav.signOut")}
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-secondary btn-sm navbar-signin">
              {t("nav.signIn")}
            </Link>
          )}

          <button
            type="button"
            className="navbar-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className={`navbar-toggle-bar ${menuOpen ? "open" : ""}`} />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="navbar-mobile-menu glass-strong">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={isActive(link.to) ? "navbar-mobile-link active" : "navbar-mobile-link"}>
              {link.label}
            </Link>
          ))}
          <div className="navbar-mobile-divider" />
          <LanguageSwitcher className="navbar-lang navbar-lang-mobile" />
          {isAuthenticated ? (
            <>
              <div className="navbar-mobile-user">
                <span className="navbar-avatar">{initials(worker?.full_name)}</span>
                <div className="navbar-user-meta">
                  <strong>{worker?.full_name}</strong>
                  <span>{worker?.role?.replace(/_/g, " ")}</span>
                </div>
              </div>
              <button className="btn btn-secondary btn-block" onClick={handleLogout}>
                {t("nav.signOut")}
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-block">
              {t("nav.signIn")}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
