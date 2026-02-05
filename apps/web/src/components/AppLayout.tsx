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
          padding: "clamp(4px, 1.5vw, 6px) clamp(8px, 2vw, 12px)",
          borderRadius: "var(--radius-md)",
          transition: "all 0.2s ease",
          position: "relative",
          fontSize: "clamp(11px, 2.8vw, 14px)",
          whiteSpace: "nowrap",
          flexShrink: 0,
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
    <div style={{ minHeight: "100vh", background: "var(--bg)", overflowX: "hidden", maxWidth: "100vw" }}>
      {/* Professional Navigation Bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(8px, 2vw, 12px)",
          padding: "clamp(8px, 2vw, 12px)",
          borderBottom: "1px solid var(--border)",
          background: "var(--card)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(10px)",
          boxShadow: "var(--shadow-sm)",
          flexWrap: "wrap",
          overflowX: "hidden",
          maxWidth: "100%",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "clamp(4px, 1vw, 8px)",
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: "clamp(14px, 3.5vw, 20px)",
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              whiteSpace: "nowrap",
            }}
          >
            ToneForge
          </div>
        </Link>

        {/* Navigation Links */}
        <nav
          style={{
            display: "flex",
            gap: "clamp(4px, 1vw, 8px)",
            marginLeft: "clamp(4px, 1vw, 8px)",
            flexWrap: "wrap",
            overflowX: "auto",
            maxWidth: "100%",
            flex: "1 1 auto",
            minWidth: 0,
            WebkitOverflowScrolling: "touch",
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
            display: "flex",
            gap: "clamp(4px, 1vw, 8px)",
            alignItems: "center",
            flexShrink: 0,
            flexWrap: "wrap",
            minWidth: 0,
          }}
        >
          <WorkspaceSwitcher />
          <button
            onClick={onLogout}
            className="secondary"
            style={{
              padding: "clamp(4px, 1.5vw, 6px) clamp(8px, 2vw, 12px)",
              fontSize: "clamp(10px, 2.5vw, 12px)",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: "clamp(8px, 2vw, 12px)", maxWidth: "100%", overflowX: "hidden", width: "100%", boxSizing: "border-box" }}>
        <Outlet />
      </main>
    </div>
  );
}