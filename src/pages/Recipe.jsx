import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getOfflineBaltiRecipe } from "../services/offlineRecipes";
import { AlertCircle, CheckCircle2, ChefHat, Download, FileText, HeartPulse, Loader2, RefreshCw, ScrollText, Soup, Users, Utensils, BarChart3, Salad, Check } from "lucide-react";

export default function Recipe() {
  const { recipeNo } = useParams();

  const [data, setData] = useState(null);
  const [language, setLanguage] = useState("english");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // =========================================================
  // LOAD RECIPE
  // =========================================================

  useEffect(() => {
    setLoading(true);
    setError("");

    getOfflineBaltiRecipe(recipeNo, language)
      .then(setData)
      .catch((e) => {
        setError(
          e?.message || "Unable to load recipe."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [recipeNo, language]);

  // =========================================================
  // HTML TO TEXT
  // Used for TXT download
  // =========================================================

  const htmlToText = (html) => {
    if (!html) return "";

    const temp = document.createElement("div");

    temp.innerHTML = html;

    return temp.innerText
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  // =========================================================
  // CLEAN INGREDIENT TEXT
  // =========================================================

  const cleanIngredientText = (text) => {
    if (!text) return "";

    let cleaned = text.trim();

    // Remove common bullet characters
    cleaned = cleaned.replace(
      /^[•●▪◦\-–—]\s*/,
      ""
    );

    // Fix known typo in current Balti recipe
    cleaned = cleaned.replace(
      /^rack\s+1[–-]2\s+eggs/i,
      "Crack 1–2 eggs"
    );

    return cleaned.trim();
  };

  // =========================================================
  // GET INGREDIENTS
  // Handles HTML + comma-separated data
  // =========================================================

  const getIngredients = () => {
    if (!data?.ingredients) {
      return [];
    }

    const html = data.ingredients;

    const temp = document.createElement("div");

    temp.innerHTML = html;

    // First try to get list items if backend already provides <li>
    const listItems = Array.from(
      temp.querySelectorAll("li")
    )
      .map((item) =>
        cleanIngredientText(item.innerText)
      )
      .filter(Boolean);

    if (listItems.length > 0) {
      return listItems;
    }

    // Otherwise use plain text
    const text = temp.innerText
      .replace(/\r/g, " ")
      .replace(/\n+/g, " ")
      .trim();

    if (!text) {
      return [];
    }

    // Split comma-separated ingredients
    const parts = text
      .split(/,(?=\s*[A-Za-z0-9\u0600-\u06FF])/)
      .map((item) =>
        cleanIngredientText(item)
      )
      .filter(Boolean);

    return parts;
  };

  // =========================================================
  // GET INSTRUCTIONS
  // Handles HTML + paragraph text
  // =========================================================

  const getInstructions = () => {
    if (!data?.instruction) {
      return [];
    }

    const html = data.instruction;

    const temp = document.createElement("div");

    temp.innerHTML = html;

    // Try existing list items first
    const listItems = Array.from(
      temp.querySelectorAll("li")
    )
      .map((item) =>
        item.innerText.trim()
      )
      .filter(Boolean);

    if (listItems.length > 0) {
      return listItems;
    }

    // Try paragraphs
    const paragraphs = Array.from(
      temp.querySelectorAll("p")
    )
      .map((item) =>
        item.innerText.trim()
      )
      .filter(Boolean);

    if (paragraphs.length > 1) {
      return paragraphs;
    }

    // Plain text fallback
    let text = temp.innerText
      .replace(/\r/g, " ")
      .replace(/\n+/g, " ")
      .trim();

    if (!text) {
      return [];
    }

    // Fix current typo
    text = text.replace(
      /^rack\s+1[–-]2\s+eggs/i,
      "Crack 1–2 eggs"
    );

    /*
      Split instructions after full stops when
      another sentence starts with a capital letter.
    */

    const steps = text
      .split(/(?<=\.)\s+(?=[A-Z])/)
      .map((step) => step.trim())
      .filter(Boolean);

    return steps.length > 0
      ? steps
      : [text];
  };

  // =========================================================
  // DOWNLOAD RECIPE
  // =========================================================

  const downloadRecipe = () => {
    if (!data) return;

    const foodName =
      data?.["Food Name"] ||
      data?.food ||
      "Recipe";

    const ingredients = htmlToText(
      data?.ingredients || ""
    );

    const instructions = htmlToText(
      data?.instruction || ""
    );

    const content = `
${foodName}
${"=".repeat(foodName.length)}

TRADITIONAL BALTI RECIPE

INGREDIENTS
-----------
${ingredients}

COOKING INSTRUCTIONS
--------------------
${instructions}

Generated by AI Smart Cooking Assistant
`.trim();

    const blob = new Blob(
      [content],
      {
        type: "text/plain;charset=utf-8",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `${foodName.replace(
        /[^a-z0-9]/gi,
        "_"
      )}_Recipe.txt`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================================================
  // DATA
  // =========================================================

  const ingredients = getIngredients();
  const instructions = getInstructions();

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="dashboard-container recipe-page">

        <div className="recipe-loading">

          <div className="loading-icon">
            <Loader2 size={30} className="spin" />
          </div>

          <h2>
            Loading recipe…
          </h2>

          <p>
            Please wait while the recipe
            is being loaded.
          </p>

        </div>

      </main>
    );
  }

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <main className="recipe-container">

      {/* =====================================================
          RECIPE HEADER
      ====================================================== */}

      <div className="recipe-title">

        <div className="recipe-heading-icon">
          <Soup size={30} />
        </div>

        <h1>
          {data?.["Food Name"] ||
            data?.food ||
            "Recipe"}
        </h1>

        <p>
          Traditional Balti Recipe
        </p>

        {/* =================================================
            LANGUAGE BUTTONS
        ================================================== */}

        <div className="language-buttons">

          <button
            type="button"
            className={
              language === "english"
                ? "active"
                : ""
            }
            onClick={() =>
              setLanguage("english")
            }
          >
            English
          </button>

          <button
            type="button"
            className={
              language === "urdu"
                ? "active"
                : ""
            }
            onClick={() =>
              setLanguage("urdu")
            }
          >
            اردو
          </button>

        </div>

      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error ? (

        <div className="error recipe-error">
          <AlertCircle size={18} /> {error}
        </div>

      ) : (

        <>

          {/* =================================================
              RECIPE CONTENT
          ================================================== */}

          <div className="recipe-content">

            {/* ===============================================
                INGREDIENTS
            ================================================ */}

            <section className="recipe-card ingredients-card">

              <div className="recipe-card-header">

                <span className="recipe-section-icon">
                  <Utensils size={22} />
                </span>

                <div>

                  <h2>
                    Ingredients
                  </h2>

                  <p>
                    Everything you need for this recipe
                  </p>

                </div>

              </div>

              {/* INGREDIENT LIST */}

              {ingredients.length > 0 ? (

                <ul className="recipe-ingredients-list">

                  {ingredients.map(
                    (ingredient, index) => (

                      <li
                        key={index}
                        className="recipe-ingredient-item"
                      >

                        <span className="ingredient-check">
                          <Check size={13} strokeWidth={3} />
                        </span>

                        <span>
                          {ingredient}
                        </span>

                      </li>

                    )
                  )}

                </ul>

              ) : (

                <div className="recipe-empty">
                  No ingredients available.
                </div>

              )}

            </section>


            {/* ===============================================
                COOKING INSTRUCTIONS
            ================================================ */}

            <section className="recipe-card instructions-card">

              <div className="recipe-card-header">

                <span className="recipe-section-icon">
                  <ChefHat size={22} />
                </span>

                <div>

                  <h2>
                    Cooking Instructions
                  </h2>

                  <p>
                    Follow these steps to prepare your dish
                  </p>

                </div>

              </div>

              {/* INSTRUCTION STEPS */}

              {instructions.length > 0 ? (

                <ol className="recipe-instructions-list">

                  {instructions.map(
                    (step, index) => (

                      <li
                        key={index}
                        className="recipe-instruction-item"
                      >

                        <span className="instruction-number">
                          {index + 1}
                        </span>

                        <p className="recipe-instruction-text">
                          {step}
                        </p>

                      </li>

                    )
                  )}

                </ol>

              ) : (

                <div className="recipe-empty">
                  No cooking instructions available.
                </div>

              )}

            </section>

          </div>


          {/* =================================================
              DOWNLOAD
          ================================================== */}

          <div className="recipe-download">

            <div className="download-info">

              <span className="download-icon">
                <FileText size={22} />
              </span>

              <div>

                <h3>
                  Save This Recipe
                </h3>

                <p>
                  Download the ingredients and
                  cooking instructions as a text file.
                </p>

              </div>

            </div>

            <button
              type="button"
              className="download-recipe-btn"
              onClick={downloadRecipe}
            >
              <Download size={18} /> Download Recipe (.txt)
            </button>

          </div>

        </>

      )}

    </main>
  );
}