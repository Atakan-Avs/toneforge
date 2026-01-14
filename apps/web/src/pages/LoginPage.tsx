import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useWorkspace } from "../contexts/WorkspaceContext";


export default function LoginPage() {
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

    async function login() {
        try {
            setError(null);

            const res = await api.post("/auth/login", {
                email: email.trim(),
                password: password.trim(),
            });

            // ✅ Token'ı kaydet (hem accessToken hem token olarak kaydet - api/client.ts ile tutarlı)
            const token = res.data.token;
            localStorage.setItem("accessToken", token);
            localStorage.setItem("token", token); // WorkspaceContext için de kaydet
            localStorage.removeItem("jwt");

            // ✅ orgId backend'den geldiyse set et (backend her zaman orgId döndürür veya oluşturur)
            if (res.data.orgId) {
                localStorage.setItem("orgId", res.data.orgId);
            }

            // ✅ Workspace'leri yükle (refresh içinde orgId otomatik korunur veya set edilir)
            await refresh();

            // ✅ Final orgId kontrolü (backend'den gelen veya refresh'ten gelen)
            const finalOrgId = localStorage.getItem("orgId");
            if (!finalOrgId) {
                // ✅ Bu durumda backend'den orgId gelmediyse ve refresh de bulamadıysa hata ver
                setError("No workspace found for this account. Please try registering again.");
                // Token'ı temizle (güvenlik için)
                localStorage.removeItem("accessToken");
                localStorage.removeItem("token");
                localStorage.removeItem("orgId");
                return;
            }

            // ✅ Başarılı: app'e yönlendir
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
                    Sign in to your account
                </p>
            </div>

            {/* Login Card */}
            <div
                className="card"
                style={{
                    width: "100%",
                    maxWidth: "420px",
                }}
            >
                <h3 style={{ marginTop: 0, marginBottom: "var(--spacing-lg)", fontSize: "24px" }}>
                    Welcome back
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
                                if (e.key === "Enter") login();
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
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") login();
                            }}
                        />
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
                        onClick={login}
                        style={{
                            marginTop: "var(--spacing-sm)",
                            padding: "14px",
                            fontSize: "15px",
                        }}
                    >
                        Sign In
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
                            Don't have an account?{" "}
                            <button
                                className="secondary"
                                onClick={() => nav("/register")}
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
                                Sign up
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}