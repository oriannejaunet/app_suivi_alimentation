import { describe, it, expect } from 'vitest';
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacroTargets } from '../src/services/calorie.service.js';

describe('calculateBMR', () => {
  it('calcule le BMR pour un homme (Mifflin-St Jeor)', () => {
    // 80kg, 180cm, 30 ans -> 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calculateBMR({ weightKg: 80, heightCm: 180, age: 30, gender: 'male' })).toBeCloseTo(1780);
  });

  it('calcule le BMR pour une femme (Mifflin-St Jeor)', () => {
    // 65kg, 165cm, 25 ans -> 10*65 + 6.25*165 - 5*25 - 161 = 650 + 1031.25 - 125 - 161 = 1395.25
    expect(calculateBMR({ weightKg: 65, heightCm: 165, age: 25, gender: 'female' })).toBeCloseTo(1395.25);
  });
});

describe('calculateTDEE', () => {
  it('applique le facteur sédentaire', () => {
    expect(calculateTDEE(1780, 'sedentary')).toBeCloseTo(1780 * 1.2);
  });

  it('applique le facteur très actif', () => {
    expect(calculateTDEE(1780, 'very_active')).toBeCloseTo(1780 * 1.9);
  });

  it('lève une erreur pour un niveau inconnu', () => {
    expect(() => calculateTDEE(1780, 'ultra')).toThrow();
  });
});

describe('calculateTargetCalories', () => {
  it("soustrait pour un objectif de perte de poids", () => {
    expect(calculateTargetCalories(2136, -500)).toBe(1636);
  });

  it('ajoute pour un objectif de prise de poids', () => {
    expect(calculateTargetCalories(2136, 300)).toBe(2436);
  });

  it('ne change rien pour un objectif de maintien', () => {
    expect(calculateTargetCalories(2136, 0)).toBe(2136);
  });
});

describe('calculateMacroTargets', () => {
  it('applique 2 g/kg de protéines et 25% de lipides pour une perte de poids', () => {
    // 80kg -> 160g protéines (640 kcal) ; 1636 kcal * 25% = 409 kcal lipides (~45g)
    // glucides = (1636 - 640 - 409) / 4 = ~147g
    const result = calculateMacroTargets({ weightKg: 80, goal: 'lose', targetCalories: 1636 });
    expect(result.proteinTargetG).toBe(160);
    expect(result.fatTargetG).toBe(45);
    expect(result.carbsTargetG).toBe(147);
  });

  it('applique 1.8 g/kg de protéines et 30% de lipides pour un maintien', () => {
    const result = calculateMacroTargets({ weightKg: 65, goal: 'maintain', targetCalories: 2136 });
    expect(result.proteinTargetG).toBe(117); // 65 * 1.8
    expect(result.fatTargetG).toBe(Math.round((2136 * 0.3) / 9));
  });

  it("ne renvoie jamais de glucides négatifs si protéines+lipides dépassent l'objectif", () => {
    const result = calculateMacroTargets({ weightKg: 150, goal: 'lose', targetCalories: 1200 });
    expect(result.carbsTargetG).toBeGreaterThanOrEqual(0);
  });

  it('retombe sur les valeurs de maintien pour un objectif inconnu', () => {
    const known = calculateMacroTargets({ weightKg: 70, goal: 'maintain', targetCalories: 2000 });
    const unknown = calculateMacroTargets({ weightKg: 70, goal: undefined, targetCalories: 2000 });
    expect(unknown).toEqual(known);
  });
});
