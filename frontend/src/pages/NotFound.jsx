import { Link } from "react-router-dom";
import GlassCard from "../components/GlassCard";

export default function NotFound() {
  return (
    <div className="page-shell" style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}>
      <GlassCard>
        <h2 style={{ marginBottom: 10 }}>Page not found</h2>
        <p style={{ color: "#5c6b85", marginBottom: 20 }}>
          The page you are looking for does not exist or may have moved.
        </p>
        <Link to="/" className="btn btn-primary">
          Return home
        </Link>
      </GlassCard>
    </div>
  );
}
