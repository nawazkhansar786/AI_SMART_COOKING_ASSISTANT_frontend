import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Camera,
  CheckCircle2,
  ChefHat,
  Home,
  Info,
  LogOut,
  Menu,
  Mountain,
  Play,
  Salad,
  Soup,
  Timer,
  X,
} from "lucide-react";
import { apiFetch } from "../services/api";

const LINKS = [
  { to: "/dashboard", label: "Home", Icon: Home },
  { to: "/pakistani-recipes", label: "Pakistani Recipes", Icon: Soup },
  { to: "/ingredients", label: "Ingredients", Icon: Salad },
  { to: "/ingredient_detection", label: "Detection", Icon: Camera },
  { to: "/balti", label: "Balti Dishes", Icon: Mountain },
  { to: "/about", label: "About", Icon: Info },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);

  const [minutes, setMinutes] = useState(20);
  const [seconds, setSeconds] = useState(1200);

  const [username, setUsername] = useState("User");
  const [timerFinished, setTimerFinished] = useState(false);
  const audioContextRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/api/session")
      .then((x) => {
        if (x.username) setUsername(x.username);
      })
      .catch(() => {});
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!timerOpen || seconds <= 0) return;

    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(id);
          setTimerFinished(true);

          // Browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Cooking timer complete", {
              body: "Your cooking time is finished. Please check your food.",
              icon: "/favicon.ico",
            });
          }

          // Alarm sound: reuse the context unlocked by the Start button.
          try {
            const audioContext = audioContextRef.current;
            if (!audioContext) throw new Error("Audio context is unavailable");
            audioContext.resume();
            [0, 0.45, 0.9].forEach((offset) => {
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              const startAt = audioContext.currentTime + offset;
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              oscillator.frequency.value = 880;
              oscillator.type = "sine";
              gainNode.gain.setValueAtTime(0.3, startAt);
              gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + 0.3);
              oscillator.start(startAt);
              oscillator.stop(startAt + 0.3);
            });
          } catch (error) {
            console.warn("Timer alarm could not play:", error);
          }

          return 0;
        }

        return s - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [timerOpen, seconds]);

  const start = () => {
    const totalMinutes = Math.max(1, Number(minutes) || 1);
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = audioContextRef.current || new AudioContext();
        audioContextRef.current.resume();
      }
    } catch (error) {
      console.warn("Timer audio could not be initialized:", error);
    }
    setSeconds(totalMinutes * 60);
    setTimerFinished(false);
  };

  const closeTimer = () => {
    setTimerOpen(false);
    setTimerFinished(false);
  };

  const logout = async () => {
    try {
      await apiFetch("/api/logout", { method: "POST" });
    } finally {
      navigate("/login");
      setOpen(false);
    }
  };

  const initial = (username || "U").trim().charAt(0).toUpperCase();

  return (
    <>
      <header className="main-navbar">
        <Link to="/dashboard" className="navbar-logo">
          <span className="brand-mark">
            <ChefHat size={21} color="#fff" strokeWidth={2} />
          </span>
          <span className="brand-text">
            Smart Cooking Assistant
            <small>AI Powered Kitchen</small>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Primary">
          {LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")}>
              {label}
            </NavLink>
          ))}
        </nav>

        <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
      </header>

      {open && (
        <div className="side-overlay" onClick={() => setOpen(false)}>
          <aside className="side-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <h3>My Account</h3>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={18} />
              </button>
            </div>

            <div className="profile-info">
              <span className="profile-avatar">{initial}</span>
              <div>
                <strong>{username}</strong>
                <small>Signed in</small>
              </div>
            </div>

            <nav>
              {LINKS.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={19} />
                  {label}
                </NavLink>
              ))}

              <div className="nav-divider" />

              <button
                onClick={() => {
                  setOpen(false);
                  setTimerFinished(false);
                  setTimerOpen(true);
                }}
              >
                <Timer size={19} />
                Cooking Timer
              </button>

              <button className="danger" onClick={logout}>
                <LogOut size={19} />
                Log out
              </button>
            </nav>
          </aside>
        </div>
      )}

      {timerOpen && (
        <div className="modal-backdrop" onClick={closeTimer}>
          <div className="timer-box" onClick={(e) => e.stopPropagation()}>
            <h2>
              <Timer size={22} color="var(--brand)" /> Cooking Timer
            </h2>

            <label htmlFor="timer-minutes">Duration (minutes)</label>
            <input
              id="timer-minutes"
              type="number"
              min="1"
              value={minutes}
              onChange={(e) => {
                setMinutes(e.target.value);
                setTimerFinished(false);
              }}
            />

            <div className="timer-buttons">
              <button className="primary" onClick={start}>
                <Play size={16} /> Start
              </button>
              <button className="secondary" onClick={closeTimer}>
                Close
              </button>
            </div>

            <div className="timer-display">
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </div>

            {timerFinished && (
              <div className="timer-complete-message">
                <strong style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 size={18} /> Cooking time complete
                </strong>
                <p>Your cooking time is finished. Please check your food.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
