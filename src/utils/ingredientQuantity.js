const PIECE_WEIGHTS = [
  { names: ["onion", "پیاز"], grams: 125 },
  { names: ["tomato", "ٹماٹر"], grams: 100 },
  { names: ["potato", "آلو"], grams: 150 },
  { names: ["carrot", "گاجر"], grams: 60 },
  { names: ["capsicum", "bell pepper", "شملہ مرچ"], grams: 100 },
  { names: ["cucumber", "کھیرا"], grams: 150 },
  { names: ["chicken", "beef", "mutton"], grams: 500 },
  { names: ["rice", "چاول"], grams: 180 },
  { names: ["flour", "آٹا", "میدہ"], grams: 120 },
  { names: ["sugar", "چینی"], grams: 4 },
  { names: ["lentil", "daal", "دال"], grams: 180 },
  { names: ["chickpea", "chana", "چنا"], grams: 170 },
];

function parseNumber(value) {
  // Convert a plain number, simple fraction, or whole-plus-fraction to a number.
  const token = normalizeNumericDigits(String(value).trim());
  if (token.includes(" ")) {
    const [whole, fraction] = token.split(/\s+/);
    const [numerator, denominator] = fraction.split("/");
    return Number(whole) + Number(numerator) / Number(denominator);
  }
  if (token.includes("/")) {
    const [numerator, denominator] = token.split("/");
    return Number(numerator) / Number(denominator);
  }
  return Number(token);
}

function normalizeNumericDigits(value) {
  const digits = "0123456789";
  const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
  const easternIndic = "۰۱۲۳۴۵۶۷۸۹";
  return String(value ?? "").replace(/[0-9٠-٩۰-۹]/g, (char) => {
    let index = arabicIndic.indexOf(char);
    if (index >= 0) return digits[index];
    index = easternIndic.indexOf(char);
    return index >= 0 ? digits[index] : char;
  });
}

function formatNumber(value, preserveUrduDigits = false) {
  const text = Number(value.toFixed(2)).toString();
  if (!preserveUrduDigits) return text;
  return text.replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}

function scaleNumbers(text, factor) {
  const original = String(text ?? "");
  const preserveUrduDigits = /[۰-۹]/.test(original);
  let normalized = normalizeNumericDigits(original)
    .replace(/[½⅓⅔¼¾]/g, (symbol) => ({
      "½": "1/2",
      "⅓": "1/3",
      "⅔": "2/3",
      "¼": "1/4",
      "¾": "3/4",
    }[symbol]));

  return normalized.replace(/\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?/g, (token) => {
    const normalizedToken = token.replace(",", ".");
    if (factor === 1 && (normalizedToken.includes("/") || normalizedToken.includes(" "))) {
      return preserveUrduDigits
        ? normalizedToken.replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)])
        : normalizedToken;
    }
    const value = parseNumber(normalizedToken);
    return Number.isFinite(value) ? formatNumber(value * factor, preserveUrduDigits) : token;
  });
}

function findPieceWeight(name) {
  const normalized = String(name ?? "").toLowerCase();
  return PIECE_WEIGHTS.find(({ names }) => names.some((item) => normalized.includes(item)));
}

function formatMass(grams) {
  if (grams >= 1000) return `${formatNumber(grams / 1000)} kg`;
  return `${formatNumber(grams)} g`;
}

function formatVolume(ml) {
  if (ml >= 1000) return `${formatNumber(ml / 1000)} L`;
  return `${formatNumber(ml)} ml`;
}

export function formatIngredientQuantity(quantity, ingredientName, factor = 1) {
  // Scale a quantity by persons/2 and improve units for display.
  // Input: quantity text, ingredient name, and serving factor (default 1).
  // Processing: scales numeric/fraction text, converts grams/kg and ml/L,
  // and adds piece or dozen conversions for known ingredients.
  // Output: display-ready quantity text. It is used when loading Gemini and CSV recipes.
  const original = String(quantity ?? "").trim();
  if (!original) return original;
  const scaled = scaleNumbers(original, factor);
  const amountMatch = normalizeNumericDigits(scaled).match(/\d+\.\d+|\d+/);
  if (!amountMatch) return scaled;
  if (/[\u0600-\u06FF]/.test(original) && !/[a-z]/i.test(original)) return scaled;

  const amount = Number(amountMatch[0]);
  const lower = scaled.toLowerCase();
  const normalizedLower = normalizeNumericDigits(lower);
  const name = String(ingredientName ?? "").toLowerCase();

  if (/(egg|انڈ)/i.test(name) && /(egg|piece|pcs|عدد|انڈ)/i.test(normalizedLower)) {
    const range = normalizedLower.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+)/);
    if (range) {
      const start = Math.round(Number(range[1]));
      const end = Math.round(Number(range[2]));
      if (start >= 12 && end >= 12 && start % 12 === 0 && end % 12 === 0) {
        return `${start / 12}-${end / 12} dozen`;
      }
      return `${start}-${end} eggs`;
    }
    const eggs = Math.round(amount);
    if (eggs >= 12 && eggs % 12 === 0) return `${eggs / 12} dozen`;
    return `${eggs} eggs`;
  }

  const pieceWeight = findPieceWeight(name);
  if (pieceWeight && /\b(piece|pieces|pcs|pc|onions?|tomatoes?|potatoes?)\b/i.test(lower)) {
    return formatMass(amount * pieceWeight.grams);
  }

  const massUnit = lower.match(/\b(kg|kgs|kilogram|kilograms|g|gram|grams)\b/);
  if (massUnit) {
    const grams = massUnit[1].startsWith("k") ? amount * 1000 : amount;
    return formatMass(grams);
  }

  const volumeUnit = lower.match(/\b(l|liter|liters|litre|litres|ml|milliliter|milliliters)\b/);
  if (volumeUnit) {
    const ml = volumeUnit[1].startsWith("l") && volumeUnit[1] !== "ml" ? amount * 1000 : amount;
    return formatVolume(ml);
  }

  return scaled;
}

export function formatIngredientItem(item, factor = 1) {
  if (!item) return item;
  return {
    ...item,
    quantity: formatIngredientQuantity(
      item.quantity ?? item.amount,
      item.ingredient_name ?? item.name,
      factor,
    ),
  };
}
