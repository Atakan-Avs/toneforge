import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useWorkspace } from "../contexts/WorkspaceContext";

export default function AuthPage() {
  const navigate = useNavigate();
  const { refresh } = useWorkspace();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function extractErrorMessage(err: any): string {
    const data = err?.response?.data;
    if (!data) return "Unexpected error";
    if (typeof data.error === "object") {
      if (data.error.fieldErrors) return Object.values(data.error.fieldErrors).flat().join(", ");
      return "Validation error";
    }
    if (typeof data.error === "string") return data.error;
    return "Request failed";
  }

  async function afterAuth(token: string) {
    localStorage.setItem("token", token);
    await refresh(); // orgId auto-select burada çalışır
    navigate("/", { replace: true }); // ✅ direkt ana sayfa
  }

  async function login() {
    try {
      setError(null);
      const res = await api.post("/auth/login", {
        email: email.trim(),
        password: password.trim(),
      });
      await afterAuth(res.data.token);
    } catch (err: any) {
      setError(err?.message ?? extractErrorMessage(err));
    }
  }

  async function register() {
    try {
      setError(null);
      const res = await api.post("/auth/register", {
        email: email.trim(),
        password: password.trim(),
      });
      await afterAuth(res.data.token);
    } catch (err: any) {
      setError(err?.message ?? extractErrorMessage(err));
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "120px auto", display: "flex", flexDirection: "column", gap: 12 }}>
      <h2>ReplyPilot</h2>

      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={login}>Login</button>
      <button onClick={register}>Register</button>
    </div>
  );
}