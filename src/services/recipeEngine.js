
const DATA_BASE = "/data/Pakistani_Food";

let ingredientsCache = null;
let recipesCache = null;

// =====================================================
// CSV LOADER
// =====================================================

async function loadTextFile(path) {
  const response = await fetch(path, { cache: "no-cache" });

  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }

  return await response.text();
}

// Simple CSV parser supporting quoted values and commas
// inside quoted fields.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        value += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      row.push(value);
      value = "";
    } else if (
      (char === "\n" || char === "\r") &&
      !insideQuotes
    ) {
      if (char === "\r" && next === "\n") {
        i++;
      }

      row.push(value);
      value = "";

      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }

      row = [];
    } else {
      value += char;
    }
  }

  row.push(value);

  if (row.some((cell) => cell.trim() !== "")) {
    rows.push(row);
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header) =>
    String(header)
      .replace(/^\uFEFF/, "")
      .trim()
  );

  return rows.slice(1).map((cells) => {
    const object = {};

    headers.forEach((header, index) => {
      object[header] = String(
        cells[index] ?? ""
      ).trim();
    });

    return object;
  });
}

// =====================================================
// LOAD RECIPE DATABASE
// =====================================================

async function loadRecipeData() {
  if (ingredientsCache && recipesCache) {
    return {
      ingredients: ingredientsCache,
      recipes: recipesCache,
    };
  }

  const [
    ingredientsText,
    recipesText,
  ] = await Promise.all([
    loadTextFile(
      `${DATA_BASE}/pakistani_ingredients.csv`
    ),
    loadTextFile(
      `${DATA_BASE}/pakistani_recipes.csv`
    ),
  ]);

  ingredientsCache = parseCSV(ingredientsText);
  recipesCache = parseCSV(recipesText);

  return {
    ingredients: ingredientsCache,
    recipes: recipesCache,
  };
}

// =====================================================
// CATEGORY MAP
// =====================================================

const categoryMap = {
  rice: "Rice",
  chicken: "Chicken",

  daal: "Daal",
  lentils: "Daal",

  corn: "Corn",
  makai: "Corn",

  bhindi: "Bhindi",
  okra: "Bhindi",

  egg: "Egg",
  eggs: "Egg",

  potato: "Potato",
  carrot: "Carrot",
  spinach: "Spinach",

  chickpeas: "Chickpeas",
  chana: "Chickpeas",

  cauliflower: "Cauliflower",
  cabbage: "Cabbage",

  yogurt: "Yogurt",

  capsicum: "Capsicum",
  onion: "Onion",
  garlic: "Garlic",
  ginger: "Ginger",
  tomato: "Tomato",
  lemon: "Lemon",
  peas: "Peas",
  flour: "Flour",
  bread: "Bread",
};

// =====================================================
// INGREDIENT NORMALIZATION
// =====================================================

const replacements = {
  eggs: "egg",
  egg: "egg",

  tomatoes: "tomato",
  tomato: "tomato",

  "garlic paste": "garlic",
  garlic: "garlic",

  "ginger paste": "ginger",
  ginger: "ginger",

  "ginger-garlic": "ginger-garlic",
  "ginger garlic": "ginger-garlic",

  "yogurt (dahi)": "yogurt",
  dahi: "yogurt",
  yogurt: "yogurt",

  "sweet corn (makai)": "corn",
  "sweet corn": "corn",
  makai: "corn",
  corn: "corn",

  "capsicum (shimla mirch)": "capsicum",
  "shimla mirch": "capsicum",
  capsicum: "capsicum",

  "spinach (palak)": "spinach",
  palak: "spinach",
  spinach: "spinach",

  "cauliflower (gobi)": "cauliflower",
  gobi: "cauliflower",
  cauliflower: "cauliflower",

  "cabbage (band gobi)": "cabbage",
  "band gobi": "cabbage",
  cabbage: "cabbage",

  "potato (aloo)": "potato",
  aloo: "potato",
  potato: "potato",

  "okra (bhindi)": "bhindi",
  okra: "bhindi",
  bhindi: "bhindi",

  "chickpeas (chana)": "chickpeas",
  chana: "chickpeas",
  chickpeas: "chickpeas",

  "lentils (daal)": "daal",
  lentils: "daal",
  daal: "daal",

  "chana daal": "daal",
  "mash daal": "daal",
  "moong daal": "daal",
  "mixed daal": "daal",

  lemon: "lemon",
  onion: "onion",
  carrot: "carrot",
  peas: "peas",

  flour: "flour",
  "wheat flour": "flour",
  "gram flour": "flour",
  "corn flour": "flour",
  "rice flour": "flour",

  bread: "bread",

  "chicken stock": "chicken stock",
};

function normalizeIngredient(name) {
  let value = String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (!value) {
    return "";
  }

  if (
    Object.prototype.hasOwnProperty.call(
      replacements,
      value
    )
  ) {
    return replacements[value];
  }

  for (const [oldValue, newValue] of Object.entries(
    replacements
  )) {
    if (value.includes(oldValue)) {
      value = value.replaceAll(
        oldValue,
        newValue
      );
    }
  }

  return value.trim();
}

// =====================================================
// PRIMARY MAP
// =====================================================

const primaryMap = {
  chicken: "chicken",
  rice: "rice",

  daal: "daal",
  lentils: "daal",

  corn: "corn",

  okra: "bhindi",
  bhindi: "bhindi",

  egg: "egg",

  potato: "potato",
  carrot: "carrot",
  spinach: "spinach",

  chickpeas: "chickpeas",

  cauliflower: "cauliflower",
  cabbage: "cabbage",

  yogurt: "yogurt",
  bread: "bread",
};

// =====================================================
// REQUIRED COMBINATIONS
// =====================================================

const requiredCombinations = {
  "chicken biryani": [
    "chicken",
    "rice",
  ],

  "chicken pulao": [
    "chicken",
    "rice",
  ],

  "yakhni pulao": [
    "chicken",
    "rice",
  ],

  "sindhi biryani": [
    "chicken",
    "rice",
    "potato",
  ],

  "chana pulao": [
    "chickpeas",
    "rice",
  ],

  "corn pulao": [
    "corn",
    "rice",
  ],

  "vegetable pulao": [
    "rice",
  ],

  "masala rice": [
    "rice",
  ],

  "chicken corn soup": [
    "chicken",
    "corn",
  ],

  "hot and sour soup": [
    "chicken",
  ],

  "chicken palak": [
    "chicken",
    "spinach",
  ],

  "palak chicken": [
    "chicken",
    "spinach",
  ],

  "daal palak": [
    "daal",
    "spinach",
  ],

  "palak daal": [
    "daal",
    "spinach",
  ],

  "aloo gobi": [
    "potato",
    "cauliflower",
  ],

  "aloo palak": [
    "potato",
    "spinach",
  ],

  "mix vegetable": [
    "carrot",
    "potato",
    "cauliflower",
  ],

  "vegetable handi": [
    "carrot",
    "potato",
    "cauliflower",
  ],

  "creamy vegetable soup": [
    "carrot",
    "potato",
    "cauliflower",
  ],

  "dahi aloo": [
    "potato",
    "yogurt",
  ],

  "dahi chicken": [
    "chicken",
    "yogurt",
  ],

  "palak paneer": [
    "spinach",
  ],
};

// =====================================================
// DEFAULT COMBINATIONS
// =====================================================

const defaultCombinations = {
  "chicken biryani":
    "Raita, Kachumber, Salad",

  "chicken pulao":
    "Raita, Salad, Chutney",

  "yakhni pulao":
    "Raita, Salad",

  "sindhi biryani":
    "Raita, Kachumber, Salad",

  "chana pulao":
    "Raita, Salad, Pickle",

  "corn pulao":
    "Raita, Salad, Chutney",

  "vegetable pulao":
    "Raita, Salad, Pickle",

  "masala rice":
    "Raita, Salad, Chutney",

  "chicken corn soup":
    "Bread, Salad",

  "hot and sour soup":
    "Bread, Spring Rolls",

  "chicken palak":
    "Raita, Salad",

  "palak chicken":
    "Raita, Salad",

  "daal palak":
    "Rice, Roti, Salad",

  "palak daal":
    "Rice, Roti, Salad",

  "aloo gobi":
    "Roti, Raita, Salad",

  "aloo palak":
    "Roti, Raita, Salad",

  "mix vegetable":
    "Roti, Raita, Salad",

  "vegetable handi":
    "Naan, Raita, Salad",

  "creamy vegetable soup":
    "Bread, Salad",

  "dahi aloo":
    "Roti, Salad, Pickle",

  "dahi chicken":
    "Naan, Raita, Salad",

  "palak paneer":
    "Roti, Naan, Salad",
};

// =====================================================
// SIMILAR RECIPE GROUPS
// =====================================================

const similarRecipeGroups = [
  [
    "daal palak",
    "palak daal",
  ],

  [
    "chicken palak",
    "palak chicken",
  ],

  [
    "aloo palak",
    "palak aloo",
  ],

  [
    "chicken biryani",
  ],

  [
    "chicken pulao",
  ],
];

function getRecipeGroup(recipeName) {
  const cleanName = String(recipeName ?? "")
    .toLowerCase()
    .trim()
    .replace(/\./g, "");

  for (const group of similarRecipeGroups) {
    if (group.includes(cleanName)) {
      return [...group]
        .sort()
        .join("|");
    }
  }

  const words = cleanName
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 2) {
    return [...words]
      .sort()
      .join("|");
  }

  return cleanName;
}

// =====================================================
// MAIN FUNCTION
// =====================================================

export async function getRecipeRecommendations(
  selected = []
) {
  const {
    ingredients,
    recipes,
  } = await loadRecipeData();

  // Normalize selected ingredients
  const selectedList = Array.from(
    new Set(
      selected
        .map((item) =>
          String(item ?? "")
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    )
  );

  const normalizedSelected = [];

  for (const item of selectedList) {
    const normalized =
      normalizeIngredient(item);

    if (
      normalized &&
      !normalizedSelected.includes(
        normalized
      )
    ) {
      normalizedSelected.push(
        normalized
      );
    }
  }

  // Selected categories
  const selectedCategories = [];

  for (const item of normalizedSelected) {
    if (
      Object.prototype.hasOwnProperty.call(
        categoryMap,
        item
      )
    ) {
      const category =
        categoryMap[item];

      if (
        !selectedCategories.includes(
          category
        )
      ) {
        selectedCategories.push(
          category
        );
      }
    }
  }

  // No main ingredient
  if (selectedCategories.length === 0) {
    return [];
  }

  const results = [];

  // ===================================================
  // LOOP RECIPES
  // ===================================================

  for (const recipe of recipes) {
    const recipeId =
      String(recipe.recipe_id ?? "")
        .trim();

    const recipeName =
      String(recipe.recipe_name ?? "")
        .trim();

    if (!recipeId || !recipeName) {
      continue;
    }

    const recipeNameClean =
      recipeName
        .toLowerCase()
        .trim()
        .replace(/\./g, "");

    // -----------------------------------------------
    // PRIMARY INGREDIENT
    // -----------------------------------------------

    const primaryRaw =
      String(
        recipe.primary_ingredient ?? ""
      ).trim();

    const primaryParts =
      primaryRaw
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

    const primaryIngredients = [];

    for (const primaryPart of primaryParts) {
      let normalizedPrimary =
        normalizeIngredient(
          primaryPart
        );

      if (
        Object.prototype.hasOwnProperty.call(
          primaryMap,
          normalizedPrimary
        )
      ) {
        normalizedPrimary =
          primaryMap[
            normalizedPrimary
          ];
      }

      if (normalizedPrimary) {
        primaryIngredients.push(
          normalizedPrimary
        );
      }
    }

    // Primary must be available
    let primaryAvailable = false;

    for (const primary of primaryIngredients) {
      if (
        normalizedSelected.includes(
          primary
        )
      ) {
        primaryAvailable = true;
        break;
      }
    }

    if (!primaryAvailable) {
      continue;
    }

    // -----------------------------------------------
    // RECIPE INGREDIENTS
    // -----------------------------------------------

    const recipeRows =
      ingredients.filter(
        (item) =>
          String(
            item.recipe_id ?? ""
          ).trim() === recipeId
      );

    const normalizedRecipe = [];
    const originalRecipeIngredients = [];

    for (const row of recipeRows) {
      const originalName =
        String(
          row.ingredient_name ?? ""
        ).trim();

      const normalized =
        normalizeIngredient(
          originalName
        );

      if (
        normalized &&
        !normalizedRecipe.includes(
          normalized
        )
      ) {
        normalizedRecipe.push(
          normalized
        );

        originalRecipeIngredients.push(
          originalName
        );
      }
    }

    // -----------------------------------------------
    // KEYWORDS
    // -----------------------------------------------

    const keywordList = [];

    if (
      Object.prototype.hasOwnProperty.call(
        recipe,
        "recipe_keywords"
      )
    ) {
      const keywordText =
        String(
          recipe.recipe_keywords ?? ""
        );

      for (const keyword of keywordText.split(
        ","
      )) {
        const normalizedKeyword =
          normalizeIngredient(
            keyword
          );

        if (normalizedKeyword) {
          keywordList.push(
            normalizedKeyword
          );
        }
      }
    }

    // -----------------------------------------------
    // REQUIRED COMBINATION
    // -----------------------------------------------

    const required =
      requiredCombinations[
        recipeNameClean
      ] || [];

    const missingRequired = [];

    for (const requiredItem of required) {
      if (
        !normalizedSelected.includes(
          requiredItem
        )
      ) {
        missingRequired.push(
          requiredItem
        );
      }
    }

    if (missingRequired.length > 0) {
      continue;
    }

    // -----------------------------------------------
    // MATCH INGREDIENTS
    // -----------------------------------------------

    const matchedItems = [];

    for (const selectedItem of normalizedSelected) {
      // Recipe ingredient matching
      for (const recipeItem of normalizedRecipe) {
        if (
          selectedItem === recipeItem ||
          selectedItem.includes(
            recipeItem
          ) ||
          recipeItem.includes(
            selectedItem
          )
        ) {
          if (
            !matchedItems.includes(
              selectedItem
            )
          ) {
            matchedItems.push(
              selectedItem
            );
          }

          break;
        }
      }

      // Keyword matching
      if (
        !matchedItems.includes(
          selectedItem
        )
      ) {
        for (const keyword of keywordList) {
          if (
            selectedItem === keyword ||
            selectedItem.includes(
              keyword
            ) ||
            keyword.includes(
              selectedItem
            )
          ) {
            matchedItems.push(
              selectedItem
            );
            break;
          }
        }
      }
    }

    const matched =
      matchedItems.length;

    let totalIngredients =
      new Set(normalizedRecipe)
        .size;

    if (totalIngredients === 0) {
      totalIngredients = 1;
    }

    // -----------------------------------------------
    // SCORE
    // -----------------------------------------------

    const percentage =
      (matched /
        totalIngredients) *
      100;

    let requiredMatched = 0;

    for (const requiredItem of required) {
      if (
        normalizedSelected.includes(
          requiredItem
        )
      ) {
        requiredMatched++;
      }
    }

    let finalScore = percentage;

    // Same +10 required ingredient bonus
    finalScore +=
      requiredMatched * 10;

    // -----------------------------------------------
    // RECOMMENDED INGREDIENTS
    // -----------------------------------------------

    const recommendedIngredients = [];

    for (
      let index = 0;
      index < normalizedRecipe.length;
      index++
    ) {
      const normalizedItem =
        normalizedRecipe[index];

      if (
        !normalizedSelected.includes(
          normalizedItem
        )
      ) {
        const displayName =
          originalRecipeIngredients[
            index
          ] || normalizedItem;

        if (
          !recommendedIngredients.includes(
            displayName
          )
        ) {
          recommendedIngredients.push(
            displayName
          );
        }
      }
    }

    // Maximum 15
    const limitedRecommended =
      recommendedIngredients.slice(
        0,
        15
      );

    // -----------------------------------------------
    // COMBINATION
    // -----------------------------------------------

    let combination =
      String(
        recipe.combination ?? ""
      ).trim();

    if (!combination) {
      combination =
        defaultCombinations[
          recipeNameClean
        ] || "";
    }

    // -----------------------------------------------
    // RECIPE GROUP
    // -----------------------------------------------

    const recipeGroup =
      getRecipeGroup(
        recipeNameClean
      );

    // -----------------------------------------------
    // RESULT
    // -----------------------------------------------

    results.push({
      recipe_id: recipeId,

      recipe_name: recipeName,

      score:
        `${matched}/${totalIngredients}`,

      matched_ingredients: matched,

      total_ingredients:
        totalIngredients,

      percentage:
        Number(
          percentage.toFixed(2)
        ),

      final_score:
        Number(
          finalScore.toFixed(2)
        ),

      combination,

      matched: matchedItems,

      required,

      missing:
        missingRequired,

      recommended_ingredients:
        limitedRecommended,

      primary_ingredient:
        primaryRaw,

      primary_available:
        primaryAvailable,

      _recipe_group:
        recipeGroup,
    });
  }

  // ===================================================
  // SORT
  // ===================================================
  //
  // 1. Number of matched ingredients
  // 2. Match percentage
  // 3. Final score
  //

  results.sort((a, b) => {
    if (
      b.matched_ingredients !==
      a.matched_ingredients
    ) {
      return (
        b.matched_ingredients -
        a.matched_ingredients
      );
    }

    if (
      b.percentage !==
      a.percentage
    ) {
      return (
        b.percentage -
        a.percentage
      );
    }

    return (
      b.final_score -
      a.final_score
    );
  });

  // ===================================================
  // REMOVE DUPLICATES
  // ===================================================

  const uniqueResults = [];
  const usedGroups = new Set();

  for (const result of results) {
    const group =
      result._recipe_group;

    if (usedGroups.has(group)) {
      continue;
    }

    usedGroups.add(group);

    const cleanResult = {
      ...result,
    };

    delete cleanResult._recipe_group;

    uniqueResults.push(
      cleanResult
    );

    // TOP 3
    if (
      uniqueResults.length >= 3
    ) {
      break;
    }
  }

  return uniqueResults;
}

// =====================================================
// TEST DATABASE
// =====================================================

export async function testRecipeDatabase() {
  const {
    ingredients,
    recipes,
  } = await loadRecipeData();

  return {
    loaded: true,

    ingredients_count:
      ingredients.length,

    recipes_count:
      recipes.length,
  };
}

// =====================================================
// CLEAR CACHE
// =====================================================

export function clearRecipeCache() {
  ingredientsCache = null;
  recipesCache = null;
}