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
  const token = String(value).trim();
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

function formatNumber(value) {
  return Number(value.toFixed(2)).toString();
}

function scaleNumbers(text, factor) {
  return String(text ?? "").replace(/\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?/g, (token) => {
    const value = parseNumber(token);
    return Number.isFinite(value) ? formatNumber(value * factor) : token;
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
  const original = String(quantity ?? "").trim();
  if (!original) return original;
  const scaled = scaleNumbers(original, factor);
  const amountMatch = scaled.match(/\d+\.\d+|\d+/);
  if (!amountMatch) return scaled;
  if (/[\u0600-\u06FF]/.test(original) && !/[a-z]/i.test(original)) return scaled;

  const amount = Number(amountMatch[0]);
  const lower = scaled.toLowerCase();
  const name = String(ingredientName ?? "").toLowerCase();

  if (/(egg|انڈ)/i.test(name) && /(egg|piece|pcs|عدد|انڈ)/i.test(lower)) {
    const range = lower.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+)/);
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
