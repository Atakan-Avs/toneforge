import { Outlet, Link, useLocation } from "react-router-dom";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

export default function AppLayout() {
  const location = useLocation();

  const onLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("jwt");
    window.location.href = "/login";
  };

  const NavLink = ({ to, label }: { to: string; label: string }) => {
    const active =
      location.pathname === to ||
      (to !== "/app" && location.pathname.startsWith(to));

    return (
      <Link
        to={to}
        style={{
          color: active ? "var(--primary)" : "var(--text-secondary)",
          fontWeight: active ? 700 : 500,
          textDecoration: "none",
          padding: "8px 16px",
          borderRadius: "var(--radius-md)",
          transition: "all 0.2s ease",
          position: "relative",
          fontSize: "14px",
          ...(active && {
            background: "var(--primary-light)",
          }),
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = "var(--input-bg)";
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        {label}
      </Link>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Professional Navigation Bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-lg)",
          padding: "var(--spacing-md) var(--spacing-xl)",
          borderBottom: "1px solid var(--border)",
          background: "var(--card)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(10px)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-sm)",
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: "20px",
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ToneForge
          </div>
        </Link>

        {/* Navigation Links */}
        <nav
          style={{
            display: "flex",
            gap: "var(--spacing-xs)",
            marginLeft: "var(--spacing-md)",
          }}
        >
          <NavLink to="/app" label="Generator" />
          <NavLink to="/app/templates" label="Templates" />
          <NavLink to="/app/brand-voices" label="Brand Voices" />
          <NavLink to="/app/billing" label="Billing" />
        </nav>

        {/* Right Side Actions */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: "var(--spacing-md)",
            alignItems: "center",
          }}
        >
          <WorkspaceSwitcher />
          <button
            onClick={onLogout}
            className="secondary"
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: "var(--spacing-xl)" }}>
        <Outlet />
      </main>
    </div>
  );
}