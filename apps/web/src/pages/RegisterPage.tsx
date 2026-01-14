import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useWorkspace } from "../contexts/WorkspaceContext";


export default function RegisterPage() {
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const { refresh, workspaces } = useWorkspace();


    function extractErrorMessage(err: any): string {
        const data = err?.response?.data;
        if (!data) return "Unexpected error";

        if (typeof data.error === "object") {
            if (data.error.fieldErrors) {
                return Object.values(data.error.fieldErrors).flat().join(", ");
            }
            return "Validation error";
        }

        if (typeof data.error === "string") return data.error;
        return "Request failed";
    }


    async function register() {
        try {
            setError(null);

            const res = await api.post("/auth/register", {
                email: email.trim(),
                password: password.trim(),
            });

            localStorage.setItem("token", res.data.token);

            if (res.data.orgId) {
                localStorage.setItem("orgId", res.data.orgId);
            }

            await refresh();

            const orgId = localStorage.getItem("orgId");
            if (!orgId) {
                setError("No workspace found for this account.");
                return;
            }

            nav("/app");
        } catch (err: any) {
            setError(extractErrorMessage(err));
        }
    }


    return (
        <div
            className="container"
            style={{
                maxWidth: "480px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                padding: "var(--spacing-xl)",
            }}
        >
            {/* Header */}
            <div
                style={{
                    marginBottom: "var(--spacing-2xl)",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        fontWeight: 800,
                        fontSize: "32px",
                        letterSpacing: "-0.02em",
                        cursor: "pointer",
                        marginBottom: "var(--spacing-sm)",
                        background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}
                    onClick={() => nav("/")}
                >
                    ToneForge
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                    Create your account to get started
                </p>
            </div>

            {/* Register Card */}
            <div
                className="card"
                style={{
                    width: "100%",
                    maxWidth: "420px",
                }}
            >
                <h3 style={{ marginTop: 0, marginBottom: "var(--spacing-lg)", fontSize: "24px" }}>
                    Create Account
                </h3>

                <div style={{ display: "grid", gap: "var(--spacing-md)" }}>
                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: 600,
                                marginBottom: "6px",
                                color: "var(--text-secondary)",
                            }}
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") register();
                            }}
                        />
                    </div>

                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: 600,
                                marginBottom: "6px",
                                color: "var(--text-secondary)",
                            }}
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") register();
                            }}
                        />
                        <p
                            style={{
                                fontSize: "12px",
                                color: "var(--text-secondary)",
                                marginTop: "4px",
                                marginBottom: 0,
                            }}
                        >
                            Minimum 6 characters required
                        </p>
                    </div>

                    {error && (
                        <div
                            style={{
                                padding: "var(--spacing-md)",
                                borderRadius: "var(--radius-md)",
                                background: "rgba(239, 68, 68, 0.15)",
                                border: "1px solid var(--error)",
                                color: "var(--error)",
                                fontSize: "13px",
                                fontWeight: 500,
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <button
                        onClick={register}
                        style={{
                            marginTop: "var(--spacing-sm)",
                            padding: "14px",
                            fontSize: "15px",
                        }}
                    >
                        Create Account
                    </button>

                    <div
                        style={{
                            textAlign: "center",
                            marginTop: "var(--spacing-md)",
                            paddingTop: "var(--spacing-md)",
                            borderTop: "1px solid var(--border)",
                        }}
                    >
                        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
                            Already have an account?{" "}
                            <button
                                className="secondary"
                                onClick={() => nav("/login")}
                                style={{
                                    padding: 0,
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--primary)",
                                    textDecoration: "underline",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                }}
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}