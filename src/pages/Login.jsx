import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ChefHat, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "../services/api";
import AuthShell from "../components/AuthShell";

export default function Login() {
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
      await apiFetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      nav("/dashboard");
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
          <ChefHat size={26} />
        </div>
        <h1>Welcome back</h1>
        <p className="subtitle">Log in to continue to your smart kitchen.</p>

        {error && (
          <div className="error">
            <AlertCircle size={18} /> {error}
          </div>
        )}

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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="options">
          <label>
            <input type="checkbox" defaultChecked /> Remember me
          </label>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <button className="primary" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>

        <p>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </form>
    </AuthShell>
  );
}
