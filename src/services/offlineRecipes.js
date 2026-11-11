const DATA_BASE = `${import.meta.env.BASE_URL}data`;
const cache = new Map();

async function readUtf8(response, path) {
  const bytes = await response.arrayBuffer();
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (text.includes("\uFFFD")) {
    console.warn(`Source data contains replacement characters: ${path}`);
  }
  return text;
}

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
      return readUtf8(response, path);
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

function offlineHealthMessage(health, language) {
  const messages = {
    english: {
      healthy: "Original recipe is recommended.",
      diabetes: "Recipe modified for Diabetes.",
      blood_pressure: "Recipe modified for High Blood Pressure.",
      weight_loss: "Recipe modified for Weight Loss.",
      weight_gain: "Recipe modified for Weight Gain.",
    },
    urdu: {
      healthy: "اصل نسخہ آپ کے لیے مناسب ہے۔",
      diabetes: "ذیابیطس کے لیے نسخے میں تبدیلی کی گئی ہے۔",
      blood_pressure: "بلند فشار خون کے لیے نسخے میں تبدیلی کی گئی ہے۔",
      weight_loss: "وزن کم کرنے کے لیے نسخے میں تبدیلی کی گئی ہے۔",
      weight_gain: "وزن بڑھانے کے لیے نسخے میں تبدیلی کی گئی ہے۔",
    },
  };
  return messages[language]?.[health] || messages.english[health];
}

function cloneRecipeItems(items) {
  return (items || []).map((item) => ({ ...item }));
}

export function getOfflineHealthRecommendation(recipe, health, language = "english") {
  const allowed = ["healthy", "diabetes", "blood_pressure", "weight_loss", "weight_gain"];
  if (!allowed.includes(health)) {
    throw new Error("Unsupported health condition.");
  }

  const ingredients = cloneRecipeItems(recipe.ingredients);
  const steps = cloneRecipeItems(recipe.steps);
  const urdu = language === "urdu";
  const ingredientName = (item) => String(item.ingredient_name ?? item.name ?? "").toLowerCase();
  const setQuantity = (item, english, urduText) => {
    item.quantity = urdu ? urduText : english;
  };

  if (health === "diabetes") {
    ingredients.forEach((item) => {
      if (ingredientName(item).includes("sugar") || ingredientName(item).includes("چینی")) {
        item.ingredient_name = urdu ? "اسٹیویا" : "Stevia";
        setQuantity(item, "As Required", "حسبِ ضرورت");
      }
    });
    steps.forEach((item) => {
      item.instruction = String(item.instruction ?? item.step ?? "")
        .replace(/sugar/gi, urdu ? "اسٹیویا" : "Stevia");
    });
  } else if (health === "blood_pressure") {
    ingredients.forEach((item) => {
      const name = ingredientName(item);
      if (name.includes("salt") || name.includes("نمک")) {
        setQuantity(item, "1/2 tsp", "آدھا چائے کا چمچ");
      } else if (name.includes("oil") || name.includes("تیل")) {
        setQuantity(item, "2 tbsp", "2 کھانے کے چمچ");
      } else if (name.includes("ghee") || name.includes("گھی")) {
        setQuantity(item, "1 tbsp", "1 کھانے کا چمچ");
      }
    });
    steps.forEach((item) => {
      item.instruction = String(item.instruction ?? item.step ?? "")
        .replace(/1 tsp salt/gi, "1/2 tsp salt")
        .replace(/5 tbsp oil/gi, "2 tbsp oil");
    });
  } else if (health === "weight_loss") {
    ingredients.forEach((item) => {
      if (ingredientName(item).includes("oil") || ingredientName(item).includes("تیل")) {
        setQuantity(item, "2 tbsp", "2 کھانے کے چمچ");
      }
    });
    steps.forEach((item) => {
      item.instruction = String(item.instruction ?? item.step ?? "")
        .replace(/cream/gi, "Low Fat Yogurt");
    });
  } else if (health === "weight_gain") {
    ingredients.push({
      ingredient_name: urdu ? "ابلا ہوا انڈا" : "Boiled Egg",
      quantity: urdu ? "2 عدد" : "2 piece",
    });
    steps.push({
      step_number: steps.length + 1,
      instruction: urdu
        ? "اضافی پروٹین کے لیے 2 ابلے ہوئے انڈوں کے ساتھ پیش کریں۔"
        : "Serve with 2 boiled eggs for extra protein.",
    });
  }

  return {
    ...recipe,
    ingredients,
    steps,
    message: offlineHealthMessage(health, language),
    source: "csv",
  };
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
  const safePersons = Math.min(20, Math.max(1, Number(persons) || 2));
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

const baltiCache = new Map();

async function loadBaltiRecipes(language) {
  const file = language === "urdu"
    ? "Balti_Food/recipes_urdu.csv"
    : "Balti_Food/recipes.csv";
  if (!baltiCache.has(file)) {
    baltiCache.set(file, loadCSV(file));
  }
  return baltiCache.get(file);
}

function normalizeBaltiName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

export async function getOfflineBaltiRecipes() {
  return loadBaltiRecipes("english");
}

export async function getOfflineBaltiRecipe(recipeNo, language = "english") {
  const recipes = await loadBaltiRecipes(language);
  const id = String(recipeNo ?? "").trim();
  const recipe = recipes.find((item) => String(item["S.No"] ?? "").trim() === id);
  if (!recipe) {
    throw new Error(`Balti recipe "${recipeNo}" was not found in the local dataset.`);
  }

  return {
    "S.No": String(recipe["S.No"] ?? "").trim(),
    "Food Name": recipe["Food Name"] ?? "",
    ingredients: recipe.Ingredients ?? "",
    instruction: recipe.Instruction ?? "",
  };
}

export async function findOfflineBaltiRecipe(food) {
  const recipes = await loadBaltiRecipes("english");
  const searchName = normalizeBaltiName(food);
  const recipe = recipes.find(
    (item) => normalizeBaltiName(item["Food Name"]) === searchName
  );
  if (!recipe) {
    throw new Error(`Balti recipe "${food}" was not found in the local dataset.`);
  }

  return {
    recipe_no: String(recipe["S.No"] ?? "").trim(),
    food: recipe["Food Name"] ?? "",
  };
}
