import React from "react";
import { Camera, ChefHat, HeartPulse, Soup } from "lucide-react";

const POINTS = [
  { Icon: Camera, text: "Detect ingredients from a photo with AI" },
  { Icon: Soup, text: "Pakistani and Balti recipes with clear steps" },
  { Icon: HeartPulse, text: "Health-adjusted versions of every dish" },
];

export default function AuthShell({ children }) {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="brand">
          <span className="brand-mark">
            <ChefHat size={21} color="#fff" />
          </span>
          Smart Cooking Assistant
        </div>

        <div>
          <h2>Cook smarter with what you already have.</h2>
          <p>
            An AI-powered kitchen companion that recommends recipes, scales portions and adapts
            dishes to your health needs.
          </p>
          <div className="auth-points">
            {POINTS.map(({ Icon, text }) => (
              <div key={text}>
                <span>
                  <Icon size={17} />
                </span>
                {text}
              </div>
            ))}
          </div>
        </div>

        <small>AI Based Smart Cooking Assistant</small>
      </section>

      <section className="auth-panel">{children}</section>
    </main>
  );
}
