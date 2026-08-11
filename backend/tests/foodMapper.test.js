import { describe, it, expect } from 'vitest';
import { mapOffProductToFoodDto, matchesSearch } from '../src/services/foodMapper.js';

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

describe('matchesSearch', () => {
  it('ignore la casse', () => {
    expect(matchesSearch('Tarte aux pommes', 'POMMES')).toBe(true);
  });

  it("trouve un nom accentué même si la requête ne l'est pas", () => {
    expect(matchesSearch('Crème brûlée', 'creme brulee')).toBe(true);
  });

  it("trouve un nom sans accent même si la requête en a un", () => {
    expect(matchesSearch('Creme brulee maison', 'crème')).toBe(true);
  });

  it('ne matche pas une sous-chaîne absente', () => {
    expect(matchesSearch('Tarte aux pommes', 'poire')).toBe(false);
  });
});
