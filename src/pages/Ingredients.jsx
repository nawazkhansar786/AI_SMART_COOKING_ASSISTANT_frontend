import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRecipeRecommendations } from "../services/recipeEngine";
import { AlertCircle, ArrowRight, Salad, Search, Users, X } from "lucide-react";

const ITEMS = [
  "Chicken", "Egg", "Rice", "Lentils", "Chickpeas", "Yogurt", "Flour",
  "Okra", "Spinach", "Lemon", "Cucumber", "Carrot", "Capsicum", "Cabbage",
  "Cauliflower", "Sweet Corn", "Tomato", "Onion", "Ginger", "Garlic",
  "Chilli Pepper", "Potato",
];

export default function Ingredients() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [persons, setPersons] = useState(2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPersonPopup, setShowPersonPopup] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const visible = useMemo(
    () => ITEMS.filter((x) => x.toLowerCase().includes(q.toLowerCase())),
    [q]
  );

  const toggle = (item) => {
    setSelected((current) => current.includes(item)
      ? current.filter((value) => value !== item)
      : [...current, item]);
  };

  const search = async () => {
    if (!selected.length) {
      setError("Please select at least one ingredient.");
      return;
    }
    setBusy(true);
    setError("");
    setRecipes([]);
    try {
      const recommendations = await getRecipeRecommendations(selected);
      setRecipes(recommendations.map((recipe) => ({
        ...recipe,
        source: "csv",
      })));
    } catch (e) {
      setError(e?.message || "Unable to load local recipes.");
    } finally {
      setBusy(false);
    }
  };

  const handleGetRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setPersons(2);
    setShowPersonPopup(true);
    setError("");
  };

  const handleContinueRecipe = () => {
    if (!selectedRecipe) return;
    const recipeName = selectedRecipe.recipe_name || selectedRecipe.name || "";
    if (!recipeName.trim()) {
      setError("Recipe name is missing.");
      return;
    }

    const selectedPersons = Math.min(20, Math.max(2, Number(persons) || 2));
    const hasGeminiDetails =
      Array.isArray(selectedRecipe.ingredients) && selectedRecipe.ingredients.length > 0 &&
      Array.isArray(selectedRecipe.steps) && selectedRecipe.steps.length > 0;

    const recipePayload = {
      ...selectedRecipe,
      recipe_name: recipeName,
      // Prefer the explicit backend source flag. Older responses without the
      // flag are classified as Gemini only when they include full recipe data.
      source: selectedRecipe.source || (hasGeminiDetails ? "gemini" : "csv"),
    };

    // sessionStorage lets the recipe survive a page refresh in the same tab.
    try {
      sessionStorage.setItem("selectedCookingRecipe", JSON.stringify(recipePayload));
    } catch (storageError) {
      console.warn("Could not cache selected recipe:", storageError);
    }

    setShowPersonPopup(false);
    navigate(
      `/pakistani_recipe/${encodeURIComponent(recipeName)}?persons=${selectedPersons}`,
      { state: { recipe: recipePayload } }
    );
  };

  return (
    <main className="dashboard-container">
      <section className="welcome">
        <span className="eyebrow"><Salad size={14} /> Pantry</span>
        <h1>Select Ingredients</h1>
        <p>Choose what you have at home and we'll suggest recipes you can cook, even offline.</p>
      </section>

      <div className="search-with-icon">
        <Search size={18} />
        <input className="search-input" placeholder="Search ingredient…" value={q}
          onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="ingredient-grid">
        {visible.map((item) => (
          <button type="button" key={item}
            className={selected.includes(item) ? "ingredient selected" : "ingredient"}
            onClick={() => toggle(item)}>{item}</button>
        ))}
      </div>

      <h2>Selected Ingredients</h2>
      <div className="tags">
        {selected.map((item) => (
          <button type="button" className="tag" key={item} onClick={() => toggle(item)}>
            {item} <X size={14} />
          </button>
        ))}
      </div>

      {error && <div className="error"><AlertCircle size={18} /> {error}</div>}

      <button type="button" className="primary action" onClick={search} disabled={busy}>
        {busy ? "Finding…" : "Find Recipes Offline"}
      </button>

      <div className="recipe-grid">
        {recipes.map((recipe, index) => (
          <article className="recipe-card" key={recipe.recipe_id || recipe.recipe_name || index}>
            <h3>{recipe.recipe_name || recipe.name}</h3>
            <p><strong>Matched Ingredients:</strong> {recipe.score ?? `${recipe.matched_ingredients || recipe.matched || 0}/${recipe.total_ingredients || recipe.total || 0}`}</p>
            {recipe.recommended_ingredients?.length > 0 && <>
              <h4>Recommended Ingredients</h4>
              <ul>{recipe.recommended_ingredients.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}</ul>
            </>}
            <p><strong>Pairs well with:</strong> {recipe.combination || recipe.best_combination || "raita, salad, chutney"}</p>
            <button type="button" className="primary inline" onClick={() => handleGetRecipe(recipe)}>
              Get Recipe <ArrowRight size={16} />
            </button>
          </article>
        ))}
      </div>

      {showPersonPopup && selectedRecipe && (
        <div className="person-popup-overlay">
          <div className="person-popup">
            <div className="person-popup-icon"><Users size={24} /></div>
            <h2>Select Persons</h2>
            <p>How many people are you cooking for?</p>
            <div className="selected-recipe-name"><strong>Recipe:</strong> {selectedRecipe.recipe_name || selectedRecipe.name}</div>
            <div className="person-input-group">
              <label htmlFor="persons">Number of Persons</label>
              <select id="persons" value={persons}
                onChange={(e) => setPersons(Number(e.target.value))}>
                {Array.from({ length: 19 }, (_, index) => index + 2).map((value) => (
                  <option key={value} value={value}>{value} persons</option>
                ))}
              </select>
              <small>Select between 2 and 20 persons.</small>
            </div>
            <div className="person-popup-actions">
              <button type="button" className="person-cancel-btn" onClick={() => {
                setShowPersonPopup(false); setSelectedRecipe(null);
              }}>Cancel</button>
              <button type="button" className="primary" onClick={handleContinueRecipe}>Continue</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
