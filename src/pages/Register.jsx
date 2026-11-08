import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, UserPlus } from "lucide-react";
import { apiFetch } from "../services/api";
import AuthShell from "../components/AuthShell";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch("/api/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      nav("/login");
    } catch (x) {
      setError(x.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <form className="auth-card" onSubmit={submit}>
        <div className="logo">
          <UserPlus size={26} />
        </div>
        <h1>Create your account</h1>
        <p className="subtitle">Join AI Based Smart Cooking Assistant.</p>

        {error && (
          <div className="error">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <input
          placeholder="Full name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email address"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="password-wrap">
          <input
            type={show ? "text" : "password"}
            placeholder="Password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button className="primary" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
