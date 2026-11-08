import React, { useEffect, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { getOfflineHealthRecommendation, getOfflinePakistaniRecipe } from "../services/offlineRecipes";
import {
  AlertCircle, CheckCircle2, ChefHat, Download, FileText, HeartPulse,
  Loader2, RefreshCw, ScrollText, Soup, Users, Utensils, BarChart3, Salad,
} from "lucide-react";

function scaleGeminiQuantity(quantity, factor) {
  const text = String(quantity ?? "");
  if (!text || factor === 1) return text;

  // Scale every numeric amount in a quantity, including fractions and ranges.
  // Examples: "1 1/2 cups" -> "3 cups" and "1-2 tbsp" -> "2-4 tbsp".
  return text.replace(/\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?/g, (token) => {
    let amount;
    if (token.includes(" ")) {
      const [whole, fraction] = token.trim().split(/\s+/);
      const [numerator, denominator] = fraction.split("/");
      amount = Number(whole) + Number(numerator) / Number(denominator);
    } else if (token.includes("/")) {
      const [numerator, denominator] = token.split("/");
      amount = Number(numerator) / Number(denominator);
    } else {
      amount = Number(token);
    }

    if (!Number.isFinite(amount)) return token;
    const scaled = Number((amount * factor).toFixed(2));
    return String(scaled);
  });
}

export default function PakistaniRecipe() {
  const { food } = useParams();
  const location = useLocation();
  const [params] = useSearchParams();
  const persons = Math.min(20, Math.max(1, Number(params.get("persons") || 2)));

  const [language, setLanguage] = useState("english");
  const [data, setData] = useState(null);
  const [updated, setUpdated] = useState(null);
  const [health, setHealth] = useState("healthy");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [healthBusy, setHealthBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadRecipe() {
      setBusy(true);
      setError("");
      setUpdated(null);
      try {
        let passedRecipe = location.state?.recipe || null;
        if (!passedRecipe) {
          try {
            const cached = sessionStorage.getItem("selectedCookingRecipe");
            if (cached) {
              const parsed = JSON.parse(cached);
              const cachedName = parsed.recipe_name || parsed.name;
              if (String(cachedName || "").trim().toLowerCase() === String(food || "").trim().toLowerCase()) {
                passedRecipe = parsed;
              }
            }
          } catch (storageError) {
            console.warn("Could not restore selected recipe:", storageError);
          }
        }

        let result;
        const hasGeminiDetails = Boolean(
          passedRecipe &&
          Array.isArray(passedRecipe.ingredients) && passedRecipe.ingredients.length > 0 &&
          Array.isArray(passedRecipe.steps) && passedRecipe.steps.length > 0
        );
        const recipeSource = passedRecipe?.source || (hasGeminiDetails ? "gemini" : "csv");

        // A Gemini recipe is never searched in the local CSV dataset. Its name
        // may be completely new, so the full object must travel with navigation.
        if (passedRecipe && recipeSource === "gemini") {
          if (!hasGeminiDetails) {
            throw new Error(
              "This Gemini recipe is incomplete. Please return to ingredient selection and generate the recipe again."
            );
          }

          const rawIngredients = language === "urdu"
            ? (passedRecipe.ingredients_urdu || passedRecipe.ingredients)
            : passedRecipe.ingredients;
          const rawSteps = language === "urdu"
            ? (passedRecipe.steps_urdu || passedRecipe.steps)
            : passedRecipe.steps;
          const normalizedIngredients = rawIngredients
            .map((item) => {
              if (typeof item === "string") {
                return { ingredient_name: item.trim(), quantity: "As required" };
              }
              if (!item || typeof item !== "object") return null;
              return {
                ingredient_name: String(item.ingredient_name || item.name || item.ingredient || "").trim(),
                quantity: String(item.quantity || item.amount || "As required"),
              };
            })
            .filter((item) => item && item.ingredient_name)
            .map((item) => ({
              ...item,
              quantity: scaleGeminiQuantity(item.quantity, persons / 2),
            }));

          const normalizedSteps = rawSteps
            .map((item, index) => {
              if (typeof item === "string") {
                return { step_number: index + 1, instruction: item.trim() };
              }
              if (!item || typeof item !== "object") return null;
              return {
                step_number: item.step_number || index + 1,
                instruction: String(item.instruction || item.step || item.description || "").trim(),
              };
            })
            .filter((item) => item && item.instruction);

          if (!normalizedIngredients.length || !normalizedSteps.length) {
            throw new Error(
              "This Gemini recipe does not contain usable ingredients and cooking instructions. Please generate it again."
            );
          }

          result = {
            ...passedRecipe,
            recipe_id: null,
            food_name: language === "urdu"
              ? (passedRecipe.recipe_name_urdu || passedRecipe.recipe_name || passedRecipe.name || food)
              : (passedRecipe.recipe_name || passedRecipe.name || food),
            persons,
            ingredients: normalizedIngredients,
            steps: normalizedSteps,
            source: "gemini",
          };
        } else {
          result = await getOfflinePakistaniRecipe(food, language, persons);
          result.source = "csv";
        }

        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Unable to load the recipe.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    loadRecipe();
    return () => { cancelled = true; };
  }, [food, persons, language, location.state]);

  const apply = async () => {
    if (!data) {
      setError("Recipe information is not available.");
      return;
    }
    if (data.source === "gemini" && (!data.ingredients?.length || !data.steps?.length)) {
      setError("This Gemini recommendation does not include full recipe details. Please find the recipe again after updating the backend.");
      return;
    }
    try {
      setError("");
      setHealthBusy(true);
      const result = getOfflineHealthRecommendation(data, health, language);
      setUpdated(result);
    } catch (e) {
      setError(e?.message || "Unable to apply the health recommendation. Please check your internet connection.");
    } finally {
      setHealthBusy(false);
    }
  };

  const downloadRecipe = () => {
    const recipe = updated ? { ...data, ...updated } : data;
    if (!recipe) return;
    const recipeName = recipe.food_name || recipe.recipe_name || food;
    const ingredients = (recipe.ingredients || []).map((item, index) => `${index + 1}. ${item.ingredient_name} — ${item.quantity}`).join("\n");
    const instructions = (recipe.steps || []).map((item, index) => `${index + 1}. ${item.instruction || item.step || ""}`).join("\n");
    let content = `${recipeName}\n${"=".repeat(String(recipeName).length)}\n\nTRADITIONAL PAKISTANI RECIPE\n\nSERVINGS\n${persons} Person(s)\n\nINGREDIENTS\n-----------\n${ingredients || "No ingredients available."}\n\nCOOKING INSTRUCTIONS\n--------------------\n${instructions || "No cooking instructions available."}\n\n`;
    if (recipe.message) content += `HEALTH RECOMMENDATION\n---------------------\n${recipe.message}\n\n`;
    content += "Generated by AI Smart Cooking Assistant\n";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${String(recipeName).replace(/[^a-z0-9]/gi, "_")}_Recipe.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (busy) return <main className="dashboard-container"><div className="recipe-loading"><div className="loading-icon"><Loader2 size={30} className="spin" /></div><h2>Loading recipe…</h2><p>Please wait while we prepare your recipe.</p></div></main>;

  return (
    <main className="recipe-container">
      <div className="recipe-title">
        <div className="recipe-heading-icon"><Soup size={30} /></div>
        <h1>{data?.food_name || data?.recipe_name || food}</h1>
        <p>Traditional Pakistani Recipe</p>
        <h3><Users size={16} /> Serves {persons}</h3>
        <div className="language-buttons">
          <button className={language === "english" ? "active" : ""} onClick={() => { setLanguage("english"); setUpdated(null); }}>English</button>
          <button className={language === "urdu" ? "active" : ""} onClick={() => { setLanguage("urdu"); setUpdated(null); }}>اردو</button>
        </div>
      </div>

      {error && <div className="error"><AlertCircle size={18} /> {error}</div>}

      <section className="recipe-original-section">
        <div className="recipe-section-title"><h2><ScrollText size={24} color="#c2410c" /> Original Recipe</h2><p>Original recipe before applying any health recommendation.</p></div>
        <div className="recipe-content">
          <section className="recipe-card">
            <div className="recipe-card-header"><div className="recipe-section-icon"><Utensils size={22} /></div><div><h2>Original Ingredients</h2><p>Ingredients for {persons} person(s)</p></div></div>
            <div className="ingredients-result"><ul>{(data?.ingredients || []).map((item, index) => <li key={index}><strong>{item.ingredient_name}</strong> — {item.quantity}</li>)}</ul></div>
          </section>
          <section className="recipe-card">
            <div className="recipe-card-header"><div className="recipe-section-icon"><ChefHat size={22} /></div><div><h2>Original Cooking Instructions</h2><p>Original cooking procedure</p></div></div>
            <div className="instructions-result"><ol>{(data?.steps || []).map((item, index) => <li key={index}>{item.instruction || item.step || ""}</li>)}</ol></div>
          </section>
        </div>
        {data?.nutrition && Object.keys(data.nutrition).length > 0 && <section className="recipe-card"><div className="recipe-card-header"><div className="recipe-section-icon"><BarChart3 size={22} /></div><div><h2>Original Nutrition</h2><p>Nutrition information before health adjustment</p></div></div><pre>{JSON.stringify(data.nutrition, null, 2)}</pre></section>}
      </section>

      <section className="health-section">
        <div className="health-header"><h2><HeartPulse size={24} color="#c2410c" /> Health Recommendation</h2><p>Select a health condition to create a health-adjusted version of this recipe.</p></div>
        <div className="health-controls">
          <label htmlFor="health-condition">Select Health Condition</label>
          <select id="health-condition" value={health} onChange={(e) => { setHealth(e.target.value); setUpdated(null); setError(""); }}>
            <option value="healthy">Healthy</option><option value="diabetes">Diabetes</option><option value="blood_pressure">High Blood Pressure</option><option value="weight_loss">Weight Loss</option><option value="weight_gain">Weight Gain</option>
          </select>
          <button className="primary" onClick={apply} disabled={healthBusy}>{healthBusy ? "Applying…" : "Apply Changes"}</button>
        </div>
        {updated?.message && <div className="success health-result-message"><h3><CheckCircle2 size={18} /> Health recommendation applied</h3><p>{updated.message}</p><small>The original recipe above has been preserved for comparison. The health-adjusted recipe is shown below.</small></div>}
      </section>

      {updated && <section className="recipe-updated-section">
        <div className="recipe-section-title updated-title"><h2><RefreshCw size={22} color="#166534" /> Health-Adjusted Recipe</h2><p>Updated ingredients and cooking instructions according to:</p><strong><HeartPulse size={15} /> {health === "blood_pressure" ? "High Blood Pressure" : health === "weight_loss" ? "Weight Loss" : health === "weight_gain" ? "Weight Gain" : health === "diabetes" ? "Diabetes" : "Healthy"}</strong></div>
        <div className="recipe-content">
          <section className="recipe-card updated-recipe-card"><div className="recipe-card-header"><div className="recipe-section-icon"><Salad size={22} /></div><div><h2>Updated Ingredients</h2><p>Health-adjusted ingredients</p></div></div><div className="ingredients-result"><ul>{(updated.ingredients || []).map((item, index) => <li key={index}><strong>{item.ingredient_name}</strong> — {item.quantity}</li>)}</ul></div></section>
          <section className="recipe-card updated-recipe-card"><div className="recipe-card-header"><div className="recipe-section-icon"><ChefHat size={22} /></div><div><h2>Updated Cooking Instructions</h2><p>Health-adjusted cooking procedure</p></div></div><div className="instructions-result"><ol>{(updated.steps || []).map((item, index) => <li key={index}>{item.instruction || item.step || ""}</li>)}</ol></div></section>
        </div>
        {updated.nutrition && Object.keys(updated.nutrition).length > 0 && <section className="recipe-card updated-recipe-card"><div className="recipe-card-header"><div className="recipe-section-icon"><BarChart3 size={22} /></div><div><h2>Updated Nutrition</h2><p>Nutrition after health adjustment</p></div></div><pre>{JSON.stringify(updated.nutrition, null, 2)}</pre></section>}
      </section>}

      <section className="recipe-download"><div className="download-info"><span className="download-icon"><FileText size={22} /></span><div><h3>Save This Recipe</h3><p>Download ingredients and cooking instructions as a text file.</p>{updated && <small>Health-adjusted recipe will be downloaded.</small>}</div></div><button className="download-recipe-btn" onClick={downloadRecipe}><Download size={18} /> Download Recipe (.txt)</button></section>
    </main>
  );
}
