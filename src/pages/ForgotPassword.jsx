import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { apiFetch } from "../services/api";
import AuthShell from "../components/AuthShell";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      const r = await apiFetch("/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMsg(r.message);
    } catch (x) {
      setError(x.message);
    }
  };

  return (
    <AuthShell>
      <form className="auth-card" onSubmit={submit}>
        <div className="logo">
          <KeyRound size={26} />
        </div>
        <h1>Forgot password?</h1>
        <p className="subtitle">Enter your registered email and we'll send a reset link.</p>

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
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button className="primary">Send reset link</button>

        <p>
          <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft size={15} /> Back to login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
