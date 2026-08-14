import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb, registerAgent, onboardedAgent } from '../helpers/api.js';

const REPAS = {
  foodName: 'Repas',
  quantityG: 100,
  caloriesPer100g: 600,
  proteinPer100g: 30,
  carbsPer100g: 60,
  fatPer100g: 20,
};

describe('GET /api/stats/summary', () => {
  beforeEach(resetDb);

  it("refuse de calculer avant la fin du questionnaire", async () => {
    const { agent } = await registerAgent();
    const res = await agent.get('/api/stats/summary');

    expect(res.status).toBe(400);
  });

  it('calcule BMR, TDEE et objectif à partir du profil', async () => {
    const { agent } = await onboardedAgent();
    const res = await agent.get('/api/stats/summary').query({ logDate: '2026-08-14' });

    // Femme 65 kg / 170 cm / 30 ans : 10*65 + 6.25*170 - 5*30 - 161 = 1401.5
    // TDEE = 1401.5 * 1.55 (moderate) = 2172.3 ; objectif = TDEE - 500
    expect(res.status).toBe(200);
    expect(res.body.bmr).toBe(1402);
    expect(res.body.tdee).toBe(2172);
    expect(res.body.targetCalories).toBe(1672);
  });

  it('agrège les entrées de la journée et déduit le restant', async () => {
    const { agent } = await onboardedAgent();
    await agent.post('/api/foodlog').send({ ...REPAS, logDate: '2026-08-14' });
    await agent.post('/api/foodlog').send({ ...REPAS, logDate: '2026-08-13' });

    const res = await agent.get('/api/stats/summary').query({ logDate: '2026-08-14' });

    expect(res.body.caloriesConsumed).toBe(600);
    expect(res.body.proteinConsumed).toBeCloseTo(30);
    expect(res.body.remainingCalories).toBe(1672 - 600);
  });
});

describe('GET /api/stats/history', () => {
  beforeEach(resetDb);

  // Régression : la plage était construite en UTC alors que les logDate sont écrites en
  // date locale, donc la journée en cours pouvait manquer (second audit, point 2).
  it('ancre la plage sur endDate et la termine exactement dessus', async () => {
    const { agent } = await onboardedAgent();
    const res = await agent.get('/api/stats/history').query({ days: 3, endDate: '2026-08-14' });

    expect(res.status).toBe(200);
    expect(res.body.map((d) => d.logDate)).toEqual(['2026-08-12', '2026-08-13', '2026-08-14']);
  });

  it('rattache les calories au bon jour de la plage', async () => {
    const { agent } = await onboardedAgent();
    await agent.post('/api/foodlog').send({ ...REPAS, logDate: '2026-08-14' });

    const res = await agent.get('/api/stats/history').query({ days: 3, endDate: '2026-08-14' });
    const parDate = Object.fromEntries(res.body.map((d) => [d.logDate, d.caloriesConsumed]));

    expect(parDate['2026-08-14']).toBe(600);
    expect(parDate['2026-08-13']).toBe(0);
  });

  it('traverse un changement de mois sans trou', async () => {
    const { agent } = await onboardedAgent();
    const res = await agent.get('/api/stats/history').query({ days: 3, endDate: '2026-09-01' });

    expect(res.body.map((d) => d.logDate)).toEqual(['2026-08-30', '2026-08-31', '2026-09-01']);
  });

  // Régression : l'historique renvoyait un seuil « perte » figé, donc un utilisateur en
  // prise de masse voyait son objectif atteint compté comme un dépassement
  // (second audit, point 3).
  it("reflète l'objectif réel de l'utilisateur, pas un seuil codé en dur", async () => {
    const { agent: perte } = await onboardedAgent('perte@test.dev', {
      goal: 'lose',
      goalRateKcal: -500,
    });
    const { agent: prise } = await onboardedAgent('prise@test.dev', {
      goal: 'gain',
      goalRateKcal: 300,
    });

    const resPerte = await perte.get('/api/stats/history').query({ days: 1, endDate: '2026-08-14' });
    const resPrise = await prise.get('/api/stats/history').query({ days: 1, endDate: '2026-08-14' });

    expect(resPerte.body[0].targetCalories).toBe(1672);
    expect(resPrise.body[0].targetCalories).toBe(2472);
    // Le maintien reste une référence neutre, identique pour les deux profils.
    expect(resPerte.body[0].maintenanceCalories).toBe(2172);
    expect(resPrise.body[0].maintenanceCalories).toBe(2172);
  });

  it('honore un goalRateKcal ajusté manuellement', async () => {
    const { agent } = await onboardedAgent('manuel@test.dev', { goal: 'lose', goalRateKcal: -200 });
    const res = await agent.get('/api/stats/history').query({ days: 1, endDate: '2026-08-14' });

    expect(res.body[0].targetCalories).toBe(1972);
  });

  it('refuse un endDate mal formé et un days hors bornes', async () => {
    const { agent } = await onboardedAgent();

    const date = await agent.get('/api/stats/history').query({ endDate: '14-08-2026' });
    const jours = await agent.get('/api/stats/history').query({ days: 999 });

    expect(date.status).toBe(400);
    expect(jours.status).toBe(400);
  });
});
