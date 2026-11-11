import Papa from "papaparse";

const BASE = `${import.meta.env.BASE_URL}data/Pakistani_Food/`;

const FILES = {
  recipes: `${BASE}pakistani_recipes.csv`,
  ingredients: `${BASE}pakistani_ingredients.csv`,
  nutrition: `${BASE}pakistani_nutrition.csv`,
  steps: `${BASE}pakistani_steps.csv`,
};

async function loadCSV(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Could not load CSV: ${path}`);
  }

  const bytes = await response.arrayBuffer();
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    console.warn(`Using Windows-1252 fallback for legacy CSV: ${path}`, error);
    text = new TextDecoder("windows-1252").decode(bytes);
  }
  if (text.includes("\uFFFD")) {
    console.warn(`Source data contains replacement characters: ${path}`);
  }

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,

      complete: (results) => {
        if (results.errors?.length) {
          console.warn("CSV warnings:", results.errors);
        }

        resolve(results.data);
      },

      error: (error) => {
        reject(error);
      },
    });
  });
}

let cachedData = null;

export async function loadOfflineRecipes() {
  if (cachedData) {
    return cachedData;
  }

  const [recipes, ingredients, nutrition, steps] =
    await Promise.all([
      loadCSV(FILES.recipes),
      loadCSV(FILES.ingredients),
      loadCSV(FILES.nutrition),
      loadCSV(FILES.steps),
    ]);

  const result = recipes.map((recipe) => {
    const recipeIngredients = ingredients.filter(
      (item) => item.recipe_id === recipe.recipe_id
    );

    const recipeNutrition = nutrition.find(
      (item) => item.recipe_id === recipe.recipe_id
    );

    const recipeSteps = steps
      .filter((item) => item.recipe_id === recipe.recipe_id)
      .sort(
        (a, b) =>
          Number(a.step_number) - Number(b.step_number)
      );

    return {
      ...recipe,

      ingredients: recipeIngredients,

      nutrition: recipeNutrition || null,

      steps: recipeSteps,
    };
  });

  cachedData = result;

  return result;
}

export async function searchOfflineRecipes(food) {
  const recipes = await loadOfflineRecipes();

  const query = String(food || "")
    .trim()
    .toLowerCase();

  if (!query) {
    return [];
  }

  return recipes.filter((recipe) => {
    const name = String(recipe.recipe_name || "").toLowerCase();

    const primary = String(
      recipe.primary_ingredient || ""
    ).toLowerCase();

    const keywords = String(
      recipe.recipe_keywords || ""
    ).toLowerCase();

    return (
      name.includes(query) ||
      primary.includes(query) ||
      keywords.includes(query)
    );
  });
}

export async function getOfflineRecipe(food) {
  const results = await searchOfflineRecipes(food);

  if (results.length === 0) {
    return null;
  }

  return results[0];
}
