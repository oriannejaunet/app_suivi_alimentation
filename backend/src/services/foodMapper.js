const KJ_TO_KCAL = 4.184;

// SQLite's LIKE (Prisma `contains`) is only case-insensitive for ASCII and doesn't
// fold accents, so "creme" wouldn't match "crème". Normalizing both sides here lets
// callers filter in JS regardless of case or diacritics.
export function normalizeForSearch(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function matchesSearch(foodName, query) {
  return normalizeForSearch(foodName).includes(normalizeForSearch(query));
}

export function mapOffProductToFoodDto(product) {
  const nutriments = product.nutriments || {};

  let caloriesPer100g = nutriments['energy-kcal_100g'];
  if (caloriesPer100g == null && nutriments['energy_100g'] != null) {
    caloriesPer100g = nutriments['energy_100g'] / KJ_TO_KCAL;
  }

  return {
    foodName: product.product_name_fr || product.product_name || 'Produit inconnu',
    brand: product.brands || null,
    caloriesPer100g: caloriesPer100g != null ? Math.round(caloriesPer100g * 10) / 10 : null,
    proteinPer100g: nutriments.proteins_100g ?? null,
    carbsPer100g: nutriments.carbohydrates_100g ?? null,
    fatPer100g: nutriments.fat_100g ?? null,
    imageUrl: product.image_front_url || null,
  };
}
