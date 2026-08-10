import { describe, it, expect } from 'vitest';
import { mapOffProductToFoodDto } from '../src/services/foodMapper.js';

describe('mapOffProductToFoodDto', () => {
  it("utilise energy-kcal_100g quand disponible", () => {
    const product = {
      product_name_fr: 'Compote de pommes',
      brands: 'Marque Test',
      nutriments: {
        'energy-kcal_100g': 55,
        proteins_100g: 0.3,
        carbohydrates_100g: 13,
        fat_100g: 0.1,
      },
      image_front_url: 'https://example.com/img.jpg',
    };
    const dto = mapOffProductToFoodDto(product);
    expect(dto.foodName).toBe('Compote de pommes');
    expect(dto.caloriesPer100g).toBe(55);
    expect(dto.proteinPer100g).toBe(0.3);
  });

  it("retombe sur energy_100g (kJ) si energy-kcal_100g est absent", () => {
    const product = {
      product_name: 'Produit sans kcal',
      nutriments: {
        energy_100g: 837, // ~200 kcal
      },
    };
    const dto = mapOffProductToFoodDto(product);
    expect(dto.caloriesPer100g).toBeCloseTo(200, 0);
  });

  it('gère un produit sans nom ni nutriments', () => {
    const dto = mapOffProductToFoodDto({});
    expect(dto.foodName).toBe('Produit inconnu');
    expect(dto.caloriesPer100g).toBeNull();
  });
});
