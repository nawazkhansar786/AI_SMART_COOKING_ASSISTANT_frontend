import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Camera, Mountain, Salad, Sparkles, Soup } from "lucide-react";

const FEATURES = [
  {
    to: "/ingredient_detection",
    title: "Ingredient Detection",
    text: "Upload a photo, detect ingredients with AI and get recipe recommendations.",
    Icon: Camera,
  },
  {
    to: "/ingredients",
    title: "Select Ingredients",
    text: "Pick what you have in your kitchen and find suitable recipes.",
    Icon: Salad,
  },
  {
    to: "/balti",
    title: "Balti Dishes",
    text: "Explore traditional food from Gilgit-Baltistan.",
    Icon: Mountain,
  },
  {
    to: "/pakistani-recipes",
    title: "Pakistani Recipes",
    text: "Search the Pakistani food dataset for complete recipes.",
    Icon: Soup,
  },
];

export default function Dashboard() {
  return (
    <main className="dashboard-container">
      <section className="welcome">
        <span className="eyebrow">
          <Sparkles size={14} /> AI Kitchen Assistant
        </span>
        <h1>Welcome to your Smart Kitchen</h1>
        <p>Your intelligent kitchen companion powered by Artificial Intelligence.</p>
      </section>

      <div className="cards">
        {FEATURES.map(({ to, title, text, Icon }) => (
          <Link className="feature-card" to={to} key={to}>
            <div className="feature-icon">
              <Icon size={24} />
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
            <span>
              Open <ArrowRight size={16} />
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
