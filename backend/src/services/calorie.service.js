export function todayLogDate() {
  return new Date().toISOString().slice(0, 10);
}

// Décale une date "YYYY-MM-DD" d'un nombre de jours. L'ancre est interprétée en UTC
// puis reformatée en UTC : le résultat ne dépend donc pas du fuseau du serveur, alors
// que `new Date(); setDate(...)` décalerait la journée pour un serveur non-UTC.
export function shiftLogDate(logDate, deltaDays) {
  const d = new Date(`${logDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export function scaleNutrition({ caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g }, quantityG) {
  const factor = quantityG / 100;
  return {
    calories: caloriesPer100g * factor,
    proteinG: proteinPer100g != null ? proteinPer100g * factor : null,
    carbsG: carbsPer100g != null ? carbsPer100g * factor : null,
    fatG: fatPer100g != null ? fatPer100g * factor : null,
  };
}

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateBMR({ weightKg, heightCm, age, gender }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

export function calculateTDEE(bmr, activityLevel) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  if (!multiplier) {
    throw new Error(`Niveau d'activité inconnu: ${activityLevel}`);
  }
  return bmr * multiplier;
}

export function calculateTargetCalories(tdee, goalRateKcal) {
  return tdee + goalRateKcal;
}

// Ajustements caloriques quotidiens par objectif, dupliqués avec le frontend
// (frontend/src/constants/goals.js) faute de code partagé entre les deux apps.
export const GOAL_RATE_KCAL = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

// Protéines en g/kg de poids corporel : plus élevé en déficit pour préserver la masse
// musculaire (référentiels usuels en nutrition sportive : ~1.6-2.2 g/kg).
const PROTEIN_G_PER_KG_BY_GOAL = {
  lose: 2.0,
  maintain: 1.8,
  gain: 1.8,
};

// Part des calories allouée aux lipides : le reste part en glucides.
const FAT_PERCENT_BY_GOAL = {
  lose: 0.25,
  maintain: 0.3,
  gain: 0.25,
};

export function calculateMacroTargets({ weightKg, goal, targetCalories }) {
  const proteinPerKg = PROTEIN_G_PER_KG_BY_GOAL[goal] ?? PROTEIN_G_PER_KG_BY_GOAL.maintain;
  const fatPercent = FAT_PERCENT_BY_GOAL[goal] ?? FAT_PERCENT_BY_GOAL.maintain;

  const proteinTargetG = weightKg * proteinPerKg;
  const fatCalories = targetCalories * fatPercent;
  const fatTargetG = fatCalories / 9;
  const carbsCalories = Math.max(targetCalories - proteinTargetG * 4 - fatCalories, 0);
  const carbsTargetG = carbsCalories / 4;

  return {
    proteinTargetG: Math.round(proteinTargetG),
    fatTargetG: Math.round(fatTargetG),
    carbsTargetG: Math.round(carbsTargetG),
  };
}

export function calculateSummary({ weightKg, heightCm, age, gender, activityLevel, goal, goalRateKcal, caloriesConsumed }) {
  const bmr = calculateBMR({ weightKg, heightCm, age, gender });
  const tdee = calculateTDEE(bmr, activityLevel);
  const targetCalories = calculateTargetCalories(tdee, goalRateKcal);
  const remainingCalories = targetCalories - caloriesConsumed;
  const macroTargets = calculateMacroTargets({ weightKg, goal, targetCalories });
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    caloriesConsumed: Math.round(caloriesConsumed),
    remainingCalories: Math.round(remainingCalories),
    ...macroTargets,
  };
}
