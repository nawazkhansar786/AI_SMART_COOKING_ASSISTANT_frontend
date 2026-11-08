const DATA_BASE = `${import.meta.env.BASE_URL}data`;
const cache = new Map();

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') { field += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(field.trim()); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(field.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = []; field = "";
    } else field += char;
  }
  if (field || row.length) { row.push(field.trim()); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

async function loadCSV(path) {
  if (cache.has(path)) return cache.get(path);
  const promise = fetch(`${DATA_BASE}/${path}`)
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load local data: ${path}`);
      return response.text();
    })
    .then(parseCSV);
  cache.set(path, promise);
  try { return await promise; }
  catch (error) { cache.delete(path); throw error; }
}

function normalizeDigits(value) {
  const urduDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  return String(value ?? "").replace(/[۰-۹٠-٩]/g, (digit) => {
    const urduIndex = urduDigits.indexOf(digit);
    if (urduIndex !== -1) return String(urduIndex);
    const arabicIndex = arabicDigits.indexOf(digit);
    return arabicIndex !== -1 ? String(arabicIndex) : digit;
  });
}

function scaleQuantity(quantity, factor) {
  const original = String(quantity ?? "").trim();
  if (!original || factor === 1) return original;
  const normalized = normalizeDigits(original);
  const match = normalized.match(/\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?/);
  if (!match) return original;
  const token = match[0].trim();
  let amount;
  if (token.includes(" ")) {
    const [whole, fraction] = token.split(/\s+/);
    const [numerator, denominator] = fraction.split("/");
    amount = Number(whole) + Number(numerator) / Number(denominator);
  } else if (token.includes("/")) {
    const [numerator, denominator] = token.split("/");
    amount = Number(numerator) / Number(denominator);
  } else amount = Number(token);
  if (!Number.isFinite(amount)) return original;
  const scaled = Number((amount * factor).toFixed(2));
  return normalized.replace(token, String(scaled));
}

export async function getOfflinePakistaniRecipe(food, language = "english", persons = 2) {
  const urdu = language === "urdu";
  const folder = urdu ? "Pakistani_Food_urdu" : "Pakistani_Food";
  const files = urdu
    ? { ingredients: "pakistani_ingredients_urdu.csv", steps: "pakistani_steps_urdu.csv", nutrition: "pakistani_nutrition_urdu.csv" }
    : { ingredients: "pakistani_ingredients.csv", steps: "pakistani_steps.csv", nutrition: "pakistani_nutrition.csv" };

  const [englishRecipes, urduRecipes, ingredients, steps, nutrition] = await Promise.all([
    loadCSV("Pakistani_Food/pakistani_recipes.csv"),
    loadCSV("Pakistani_Food_urdu/pakistani_recipes_urdu.csv"),
    loadCSV(`${folder}/${files.ingredients}`),
    loadCSV(`${folder}/${files.steps}`),
    loadCSV(`${folder}/${files.nutrition}`),
  ]);

  const searchName = String(food ?? "").trim().toLowerCase();
  const englishMatch = englishRecipes.find((item) => item.recipe_name?.trim().toLowerCase() === searchName);
  const urduMatch = urduRecipes.find((item) => item["رسیپی_کا_نام"]?.trim().toLowerCase() === searchName);
  const recipeId = englishMatch?.recipe_id ?? urduMatch?.["رسیپی_آئی_ڈی"];
  if (!recipeId) throw new Error(`Recipe "${food}" was not found in the local dataset.`);

  const recipe = urdu
    ? urduRecipes.find((item) => item["رسیپی_آئی_ڈی"] === recipeId)
    : englishRecipes.find((item) => item.recipe_id === recipeId);
  const idKey = urdu ? "رسیپی_آئی_ڈی" : "recipe_id";
  const safePersons = Math.min(10, Math.max(1, Number(persons) || 2));
  const factor = safePersons / 2;

  const recipeIngredients = ingredients.filter((item) => item[idKey] === recipeId).map((item) => ({
    ingredient_name: urdu ? item["جزو_کا_نام"] : item.ingredient_name,
    quantity: scaleQuantity(urdu ? item["مقدار"] : item.quantity, factor),
  }));
  const recipeSteps = steps.filter((item) => item[idKey] === recipeId)
    .sort((a, b) => Number(a[urdu ? "قدم_نمبر" : "step_number"]) - Number(b[urdu ? "قدم_نمبر" : "step_number"]))
    .map((item) => ({ instruction: urdu ? item["ہدایت"] : item.instruction }));
  const nutritionRow = nutrition.find((item) => item[idKey] === recipeId);

  return {
    recipe_id: recipeId,
    food_name: urdu ? recipe?.["رسیپی_کا_نام"] : recipe?.recipe_name,
    persons: safePersons,
    ingredients: recipeIngredients,
    steps: recipeSteps,
    nutrition: nutritionRow ?? null,
    source: "csv",
  };
}
