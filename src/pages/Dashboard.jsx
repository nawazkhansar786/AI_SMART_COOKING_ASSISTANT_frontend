import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Camera, Check, Mountain, Salad, Soup, Sparkles, WandSparkles } from "lucide-react";

const FEATURES = [
  {
    to: "/ingredient_detection",
    title: "Ingredient Detection",
    text: "Detect ingredients from an image using AI.",
    action: "Detect Ingredients",
    image: "/images/ingredient-detection.jpg",
    Icon: Camera,
  },
  {
    to: "/ingredients",
    title: "Ingredient Selection",
    text: "Select available ingredients to discover suitable recipes.",
    action: "Select Ingredients",
    image: "/images/ingredient-selection.jpg",
    Icon: Salad,
  },
  {
    to: "/balti",
    title: "Traditional Balti Dishes",
    text: "Explore traditional recipes from the beautiful Balti region.",
    action: "Explore Balti Dishes",
    image: "/images/balti-dishes.jpg",
    Icon: Mountain,
  },
  {
    to: "/pakistani-recipes",
    title: "Pakistani Dishes",
    text: "Discover delicious traditional Pakistani recipes.",
    action: "Explore Pakistani Dishes",
    image: "/images/pakistani-dishes.jpg",
    Icon: Soup,
  },
];

export default function Dashboard() {
  return (
    <main className="dashboard-container">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="eyebrow"><Sparkles size={14} /> Your intelligent kitchen</span>
          <h1>Discover the Joy of Cooking</h1>
          <p>Explore traditional Pakistani and Balti dishes, discover recipes from your ingredients, and enjoy smarter cooking.</p>
          <div className="hero-actions">
            <Link className="primary" to="/pakistani-recipes"><Soup size={18} /> Explore Recipes <ArrowRight size={16} /></Link>
            <Link className="hero-text-link" to="/ingredient_detection"><Camera size={16} /> Detect Ingredients</Link>
          </div>
          <div className="hero-proof"><Check size={16} /> Offline recipes included <span /> <Check size={16} /> Pakistani and Balti cuisine <span /> <Check size={16} /> Health-aware cooking</div>
        </div>
        <div className="hero-orbit" aria-hidden="true"><div className="hero-orbit-inner"><WandSparkles size={42} /></div></div>
      </section>

      <div className="cards dashboard-feature-grid">
        {FEATURES.map(({ to, title, text, action, image, Icon }) => (
          <Link className="feature-card dashboard-entry-card" to={to} key={to}>
            <div className="dashboard-entry-image"><img src={image} alt={`${title} placeholder`} /></div>
            <div className="feature-icon"><Icon size={24} /></div>
            <h2>{title}</h2>
            <p>{text}</p>
            <span>{action} <ArrowRight size={16} /></span>
          </Link>
        ))}
      </div>
    </main>
  );
}
