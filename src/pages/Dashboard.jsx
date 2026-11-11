import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Camera, Check, ChefHat, HeartPulse, Leaf, Mountain, Salad, Search, Sparkles, Soup, Users, WandSparkles } from "lucide-react";

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

const POPULAR_RECIPES = [
  { name: "Chicken Biryani", category: "Pakistani classic", time: "55 min", servings: "4 servings", image: "/images/background.jpg", position: "center 58%", to: "/pakistani_recipe/Chicken%20Biryani?persons=4" },
  { name: "Chicken Karahi", category: "Family favourite", time: "40 min", servings: "3 servings", image: "/images/background.jpg", position: "center 34%", to: "/pakistani_recipe/Chicken%20Karahi?persons=3" },
  { name: "Balti Kulcha", category: "Gilgit-Baltistan", time: "45 min", servings: "4 servings", image: "/images/kulcha.jpg", position: "center 72%", to: "/balti" },
];

const STEPS = [
  { number: "01", title: "Show us what you have", text: "Upload a pantry photo or choose ingredients by hand." },
  { number: "02", title: "Get a smart match", text: "AI finds recipes that fit your ingredients and your time." },
  { number: "03", title: "Make it yours", text: "Scale servings and adjust recipes for your health goals." },
];

export default function Dashboard() {
  return (
    <main className="dashboard-container">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="eyebrow"><Sparkles size={14} /> Your intelligent kitchen</span>
          <h1>Turn your ingredients into something delicious.</h1>
          <p>Discover recipes, cook smarter, and create delicious moments with AI.</p>
          <div className="hero-actions">
            <Link className="primary" to="/ingredient_detection"><ChefHat size={18} /> Start cooking <ArrowRight size={16} /></Link>
            <Link className="hero-text-link" to="/pakistani-recipes"><Search size={16} /> Explore recipes</Link>
          </div>
          <div className="hero-proof"><Check size={16} /> Offline recipes included <span /> <Check size={16} /> Pakistani and Balti cuisine <span /> <Check size={16} /> Health-aware cooking</div>
        </div>
        <div className="hero-orbit" aria-hidden="true"><div className="hero-orbit-inner"><WandSparkles size={42} /></div></div>
      </section>

      <section className="editorial-intro">
        <div><span className="section-kicker">Made for curious cooks</span><h2>A little inspiration goes a long way.</h2></div>
        <p>Whether you are planning a feast or solving dinner with what is left in the pantry, your next great meal starts here.</p>
      </section>

      <section className="popular-section">
        <div className="section-heading"><div><span className="section-kicker">From the recipe table</span><h2>Popular right now</h2></div><Link className="section-link" to="/pakistani-recipes">View all recipes <ArrowRight size={15} /></Link></div>
        <div className="popular-grid">
          {POPULAR_RECIPES.map((recipe) => <Link className="popular-card" to={recipe.to} key={recipe.name}>
            <div className="popular-card-image"><img src={recipe.image} alt={recipe.name} style={{ objectPosition: recipe.position }} /><span>{recipe.category}</span></div>
            <div className="popular-card-body"><h3>{recipe.name}</h3><p>Traditional flavour, thoughtfully prepared for your kitchen.</p><div className="recipe-meta"><span>{recipe.time}</span><span>{recipe.servings}</span></div><strong>View recipe <ArrowRight size={15} /></strong></div>
          </Link>)}
        </div>
      </section>

      <div className="cards dashboard-feature-grid">
        {FEATURES.map(({ to, title, text, Icon }) => (
          <Link className="feature-card" to={to} key={to}><div className="feature-icon"><Icon size={24} /></div><h3>{title}</h3><p>{text}</p><span>Open <ArrowRight size={16} /></span></Link>
        ))}
      </div>

      <section className="dashboard-split storytelling-section">
        <div className="split-panel split-panel-image">
          <Leaf size={27} className="panel-mark" />
          <span className="section-kicker">Cook with what you have</span>
          <h2>Less waste. More delicious possibilities.</h2>
          <p>Choose the ingredients in your kitchen and discover recipes that make every good thing count.</p>
          <Link className="secondary" to="/ingredients"><Salad size={17} /> Find my next meal</Link>
        </div>
        <div className="split-panel split-panel-dark">
          <Mountain size={28} className="panel-mark" />
          <span className="section-kicker">A taste of the north</span>
          <h2>Discover traditional Balti food.</h2>
          <p>Explore recipes from Gilgit-Baltistan, preserved with clear ingredients and step-by-step instructions.</p>
          <Link className="light-link" to="/balti">Explore Balti dishes <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="ai-callout"><div className="ai-callout-icon"><Camera size={25} /></div><div><span className="section-kicker">Your ingredients, understood</span><h2>Let AI see what is waiting in your kitchen.</h2><p>Take a photo, get confident suggestions, and move from wondering what to cook to enjoying it.</p></div><Link className="primary" to="/ingredient_detection">Try ingredient detection <ArrowRight size={16} /></Link></section>

      <section className="health-banner"><div><span className="section-kicker">Nourish your routine</span><h2>Recipes that flex with your life.</h2><p>Adjust portions and explore health-aware recommendations without losing the character of the dish.</p></div><div className="health-stat"><HeartPulse size={22} /><strong>5</strong><span>health pathways</span></div><Link className="secondary" to="/pakistani-recipes"><Users size={17} /> Explore recipes</Link></section>

      <section className="how-it-works">
        <div className="section-heading centered"><div><span className="section-kicker">Your sous-chef, simplified</span><h2>From pantry to plate</h2></div></div>
        <div className="steps-grid">
          {STEPS.map((step) => <div className="step" key={step.number}><span className="step-number">{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></div>)}
        </div>
      </section>

      <footer className="dashboard-footer"><div><strong>Smart Cooking Assistant</strong><span>Make every ingredient count.</span></div><Link to="/about">About the project <ArrowRight size={15} /></Link></footer>
    </main>
  );
}
