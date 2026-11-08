import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, LockKeyhole } from "lucide-react";
import { apiFetch } from "../services/api";
import AuthShell from "../components/AuthShell";

export default function ResetPassword() {
  const { token } = useParams();
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const r = await apiFetch(`/api/reset-password/${encodeURIComponent(token)}`, {
        method: "POST",
        body: JSON.stringify({ password: p, confirm_password: c }),
      });
      setMsg(r.message);
      setTimeout(() => nav("/login"), 1200);
    } catch (x) {
      setError(x.message);
    }
  };

  return (
    <AuthShell>
      <form className="auth-card" onSubmit={submit}>
        <div className="logo">
          <LockKeyhole size={26} />
        </div>
        <h1>Reset password</h1>
        <p className="subtitle">Choose a new password for your account.</p>

        {error && (
          <div className="error">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {msg && (
          <div className="success">
            <CheckCircle2 size={18} /> {msg}
          </div>
        )}

        <input
          type="password"
          placeholder="New password"
          autoComplete="new-password"
          value={p}
          onChange={(e) => setP(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm password"
          autoComplete="new-password"
          value={c}
          onChange={(e) => setC(e.target.value)}
          required
        />

        <button className="primary">Reset password</button>

        <p>
          <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft size={15} /> Back to login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
