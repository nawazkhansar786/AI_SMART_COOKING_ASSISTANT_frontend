
import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ChefHat,
  Search,
  Soup,
  Utensils,
} from "lucide-react";

import { getOfflinePakistaniRecipe } from "../services/offlineRecipes";

// Pakistani recipe dataset
const RECIPES = [
  "Chicken Karahi",
  "Chicken Handi",
  "Chicken Biryani",
  "Chicken Qorma",
  "Chicken Jalfrezi",
  "Chicken Makhni",
  "Chicken Palak",
  "Chicken Tikka",
  "Chicken Pulao",
  "Yakhni Pulao",
  "Vegetable Pulao",
  "Sindhi Biryani",
  "Zeera Rice",
  "Masala Rice",
  "Bhindi Masala",
  "Bhindi Do Pyaza",
  "Crispy Bhindi",
  "Aloo Gobi",
  "Mix Vegetable",
  "Aloo Shimla Mirch",
  "Gajar Matar",
  "Vegetable Handi",
  "Daal Chana",
  "Daal Mash",
  "Daal Moong",
  "Daal Tadka",
  "Daal Palak",
  "Chana Masala",
  "Aloo Chana",
  "Chana Pulao",
  "Chana Curry",
  "Anda Curry",
  "Anda Masala",
  "Pakistani Omelette",
  "Shakshuka",
  "Aloo Zeera",
  "Aloo Masala",
  "Aloo Palak",
  "Crispy Masala Potatoes",
  "Corn Masala",
  "Corn Pulao",
  "Creamy Corn Curry",
  "Dahi Chicken",
  "Dahi Aloo",
  "Dahi Kadhi",
  "Palak Chicken",
  "Palak Paneer",
  "Palak Daal",
  "Aloo Paratha",
  "Chicken Paratha",
  "Gajar Ki Sabzi",
  "Chicken Corn Soup",
  "Hot and Sour Soup",
  "Chicken Yakhni Soup",
  "Daal Soup",
  "Creamy Vegetable Soup",
  "Gajar Ka Halwa",
  "Shahi Tukray",
  "Kheer",
];

export default function PakistaniRecipes() {
  const [food, setFood] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Search suggestions remain unchanged.
  const suggestions = useMemo(() => {
    const query = food.trim().toLowerCase();

    if (!query) return [];

    return RECIPES.filter((recipe) =>
      recipe.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [food]);

  // Load recipe from local CSV files instead of the backend API.
  const search = async (e, selectedFood = null) => {
    e?.preventDefault();

    const searchFood = (selectedFood || food).trim();

    if (!searchFood) {
      setError("Please enter a recipe name.");
      return;
    }

    setFood(searchFood);
    setShowSuggestions(false);
    setBusy(true);
    setError("");
    setResult(null);

    try {
      const recipe = await getOfflinePakistaniRecipe(
        searchFood,
        "english",
        2
      );

      setResult({
        food: recipe.food_name,
        ingredients: recipe.ingredients,
        instruction: recipe.steps,
      });
    } catch (x) {
      setError(
        x.message || "Recipe could not be loaded offline."
      );
    } finally {
      setBusy(false);
    }
  };

  const selectSuggestion = (recipe) => {
    setFood(recipe);
    setShowSuggestions(false);
    search(null, recipe);
  };

  return (
    <main className="dashboard-container">
      <div className="welcome">
        <span className="eyebrow">
          <Soup size={14} /> Recipe Collection
        </span>

        <h1>Pakistani Recipes</h1>

        <p>
          Search Pakistani recipes and view ingredients
          and instructions offline.
        </p>
      </div>

      <form
        className="search-box pakistan-search-box"
        onSubmit={search}
      >
        <div className="recipe-search-wrapper">
          <div className="search-with-icon">
            <Search size={18} />

            <input
              value={food}
              onChange={(e) => {
                setFood(e.target.value);
                setShowSuggestions(true);
                setError("");
                setResult(null);
              }}
              onFocus={() => {
                if (food.trim()) {
                  setShowSuggestions(true);
                }
              }}
              placeholder="Search Pakistani recipe…"
              autoComplete="off"
            />
          </div>

          {showSuggestions &&
            food.trim() &&
            suggestions.length > 0 && (
              <div className="recipe-suggestions">
                {suggestions.map((recipe) => (
                  <button
                    type="button"
                    key={recipe}
                    className="recipe-suggestion-item"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectSuggestion(recipe)}
                  >
                    <span className="suggestion-icon">
                      <Soup size={17} />
                    </span>

                    <span className="suggestion-name">
                      {recipe}
                    </span>
                  </button>
                ))}
              </div>
            )}

          {showSuggestions &&
            food.trim() &&
            suggestions.length === 0 && (
              <div className="recipe-no-suggestion">
                No matching recipe found.
              </div>
            )}
        </div>

        <button
          type="submit"
          className="primary"
          disabled={busy}
        >
          {busy ? "Loading…" : "Search"}
        </button>
      </form>

      {error && (
        <div className="error">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {result && (
        <article className="recipe-card pakistan-result-card">
          <h2>{result.food}</h2>

          <h3>
            <Utensils size={16} /> Ingredients
          </h3>

          <div className="html-result">
            {result.ingredients.length > 0 ? (
              <ul>
                {result.ingredients.map((item, index) => (
                  <li key={`${item.ingredient_name}-${index}`}>
                    {item.ingredient_name}
                    {item.quantity ? ` — ${item.quantity}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No ingredients available for this recipe.</p>
            )}
          </div>

          <h3>
            <ChefHat size={16} /> Instructions
          </h3>

          <div className="html-result">
            {result.instruction.length > 0 ? (
              <ol>
                {result.instruction.map((item, index) => (
                  <li key={index}>{item.instruction}</li>
                ))}
              </ol>
            ) : (
              <p>
                No instructions available for this recipe.
              </p>
            )}
          </div>
        </article>
      )}
    </main>
  );
}
