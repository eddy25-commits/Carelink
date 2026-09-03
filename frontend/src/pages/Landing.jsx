import { Link } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import { useLanguage } from "../i18n/LanguageContext";

export default function Landing() {
  const { t } = useLanguage();

  return (
    <div className="page-shell">
      <section className="hero">
        <div className="hero-bubbles" aria-hidden="true">
          <span className="hero-bubble hero-bubble-1" />
          <span className="hero-bubble hero-bubble-2" />
          <span className="hero-bubble hero-bubble-3" />
          <span className="hero-bubble hero-bubble-4" />
          <span className="hero-bubble hero-bubble-5" />
        </div>

        <div className="hero-inner">
          <div className="hero-copy">
            <span className="hero-eyebrow">
              <span className="hero-live-dot" aria-hidden="true" />
              {t("landing.eyebrow")}
            </span>
            <h1>{t("landing.heading")}</h1>
            <p>{t("landing.subheading")}</p>
            <div className="hero-actions">
              <Link to="/report" className="btn btn-primary">
                {t("landing.reportCta")}
              </Link>
              <Link to="/track" className="btn btn-secondary">
                {t("landing.trackCta")}
              </Link>
            </div>
          </div>

          <div className="hero-media">
            <div className="hero-media-glow" aria-hidden="true" />
            <img
              className="hero-media-img"
              src="/IMG_1273.jpeg"
              alt="A community health worker in a white coat with a stethoscope, ready to help"
              loading="eager"
            />
          </div>
        </div>
      </section>

      <div className="option-grid">
        <Link to="/report" style={{ textDecoration: "none" }}>
          <GlassCard className="option-card">
            <div className="option-icon" aria-hidden="true">
              ✚
            </div>
            <h3>{t("landing.submitTitle")}</h3>
            <p>{t("landing.submitBody")}</p>
          </GlassCard>
        </Link>

        <Link to="/track" style={{ textDecoration: "none" }}>
          <GlassCard className="option-card">
            <div className="option-icon" aria-hidden="true">
              ⟳
            </div>
            <h3>{t("landing.trackTitle")}</h3>
            <p>{t("landing.trackBody")}</p>
          </GlassCard>
        </Link>

        <Link to="/login" style={{ textDecoration: "none" }}>
          <GlassCard className="option-card">
            <div className="option-icon" aria-hidden="true">
              ◎
            </div>
            <h3>{t("landing.loginTitle")}</h3>
            <p>{t("landing.loginBody")}</p>
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}
