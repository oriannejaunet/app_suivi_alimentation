const KJ_TO_KCAL = 4.184;

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
