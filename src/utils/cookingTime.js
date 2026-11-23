export function estimateStepMinutes(instruction, persons = 2, baseMinutes = null) {
  const text = String(instruction || "").toLowerCase();
  const people = Math.min(20, Math.max(1, Number(persons) || 2));
  const explicit = Number(baseMinutes);
  let base = Number.isFinite(explicit) && explicit > 0 ? Math.round(explicit) : null;

  if (!base) {
    if (/simmer|biryani|rice|stew|boil|bake|ابال|دم|چاول|شوربہ/.test(text)) {
      base = /rice|biryani|boil|چاول|ابال/.test(text) ? 12 : 8;
    } else if (/fry|brown|golden|saute|sauté|بھون|تلیں|سنہری/.test(text)) {
      base = 6;
    } else if (/soak|marinate|prepare|wash|chop|mix|cut|تیار|دھو|مل|کٹی/.test(text)) {
      base = 5;
    } else if (/heat oil|garnish|add|serve|تیل گرم|چھڑک|پیش/.test(text)) {
      base = 3;
    } else {
      base = 5;
    }
  }

  if (/soak|marinate|steam|dum|rest|بھگو|مرینیٹ|دم|بھاپ/.test(text)) {
    return base;
  }
  if (/serve|garnish|add|mix|chop|wash|prepare|پیش|چھڑک|تیار|مل|دھو/.test(text)
      && !/cook|fry|boil|simmer|biryani|rice|curry|پک|بھون|چاول|شوربہ|ٹماٹر|چکن|مرغی/.test(text)) {
    return base;
  }

  // Quantity-dependent operations scale proportionally with the selected portion.
  // A 3-minute step for 2 people becomes 6, 9, 15 and 30 minutes for 4, 6, 10
  // and 20 people respectively.
  return Math.max(1, Math.round(base * (people / 2)));
}

export function normalizeCookingStep(item, index, persons = 2) {
  if (typeof item === "string") {
    const minutes = estimateStepMinutes(item, persons);
    return {
      step_number: index + 1,
      instruction: appendEstimatedTime(item.trim(), minutes),
      estimated_time_minutes: minutes,
      heat_level: "medium",
    };
  }
  const instruction = String(item?.instruction || item?.step || item?.description || "").trim();
  const explicit = item?.estimated_time_minutes ?? item?.cooking_time_minutes ?? item?.time_minutes ?? item?.estimatedTimeMinutes;
  const minutes = estimateStepMinutes(instruction, persons, explicit);
  return {
    step_number: item?.step_number ?? item?.stepNo ?? index + 1,
    instruction: appendEstimatedTime(instruction, minutes),
    estimated_time_minutes: minutes,
    heat_level: item?.heat_level || item?.heatLevel || "medium",
  };
}

export function appendEstimatedTime(instruction, minutes) {
  let text = String(instruction || "").trim();
  if (!text) return text;
  const timePattern = /(?:[\d٠-٩۰-۹][\d٠-٩۰-۹]*(?:\s*[–-]\s*[\d٠-٩۰-۹][\d٠-٩۰-۹]*)?\s*(?:minutes?|mins?|hours?|hrs?|seconds?|منٹ|منٹوں|گھنٹے|گھنٹا|سیکنڈ))/gi;
  const explicitMatches = text.match(timePattern) || [];
  const approxMatches = text.match(/approximately|تقریباً/gi) || [];
  text = text
    .replace(/\s+for\s+approximately\s+\d+(?:[–-]\d+)?\s+minutes\.?\s*$/i, "")
    .replace(/\s*—?\s*تقریباً\s*[۰-۹0-9]+(?:[–-][۰-۹0-9]+)?\s+منٹ۔?\s*$/, "");
  text = text.replace(/\s*\(approximately\s+\d+(?:[–-]\d+)?\s+minutes\)\.?\s*$/i, "");
  text = text.replace(/\s*\(تقریباً\s*[۰-۹0-9]+(?:[–-][۰-۹0-9]+)?\s+منٹ\)۔?\s*$/, "");
  const clean = text.replace(/[.۔]\s*$/, "");
  if (explicitMatches.length >= 2) return clean;
  if (explicitMatches.length === 1 && approxMatches.length >= 1) return String(instruction || "").trim();
  if (explicitMatches.length >= 1 || approxMatches.length >= 1) return String(instruction || "").trim();


  const lower = text.toLowerCase();
  if (/wash|dho|دھو/.test(lower) && !/soak|marinate|بھگو|مرینیٹ|ابال/.test(lower)) return text;
  if (/soak|marinate|بھگو|مرینیٹ/.test(lower)) return text;

  let estimated = String(Number.isFinite(Number(minutes)) && Number(minutes) > 0 ? Math.round(Number(minutes)) : 5);
  if (/steam|dum|دم|بھاپ/.test(lower) && !/biryani|rice|چاول/.test(lower)) estimated = "15–20";

  const urduText = /[\u0600-\u06FF]/.test(text);
  const finalClean = text.replace(/[.۔]\s*$/, "");
  return urduText
    ? `${finalClean} — تقریباً ${estimated} منٹ۔`
    : `${finalClean} for approximately ${estimated} minutes.`;
}

export function getTotalCookingMinutes(steps = []) {
  return (steps || []).reduce((total, step) => total + (Number(step.estimated_time_minutes) || 0), 0);
}
