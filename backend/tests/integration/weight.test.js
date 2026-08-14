import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb, onboardedAgent } from '../helpers/api.js';

describe('POST /api/weight', () => {
  beforeEach(resetDb);

  // Régression : le formulaire n'envoyait pas de logDate, donc le serveur retombait sur
  // la date UTC et l'upsert pouvait écraser la pesée de la veille (second audit, point 1).
  it('enregistre la pesée sur la logDate envoyée par le client', async () => {
    const { agent } = await onboardedAgent();
    const res = await agent.post('/api/weight').send({ weightKg: 64.2, logDate: '2026-08-14' });

    expect(res.status).toBe(201);
    expect(res.body.logDate).toBe('2026-08-14');
    expect(res.body.weightKg).toBeCloseTo(64.2);
  });

  it('met à jour la pesée du jour au lieu de créer un doublon', async () => {
    const { agent } = await onboardedAgent();
    await agent.post('/api/weight').send({ weightKg: 64.2, logDate: '2026-08-14' });
    await agent.post('/api/weight').send({ weightKg: 63.8, logDate: '2026-08-14' });

    const res = await agent.get('/api/weight').query({ days: 30, endDate: '2026-08-14' });

    expect(res.body).toHaveLength(1);
    expect(res.body[0].weightKg).toBeCloseTo(63.8);
  });

  it('synchronise le poids du profil sur la pesée du jour', async () => {
    const { agent } = await onboardedAgent();
    await agent.post('/api/weight').send({ weightKg: 63.5, logDate: '2026-08-14' });

    const profil = await agent.get('/api/profile');
    expect(profil.body.weightKg).toBeCloseTo(63.5);
  });

  // Comportement documenté : une saisie rétroactive ne doit pas écraser un poids plus
  // récent déjà enregistré, car il alimente le calcul du BMR.
  it("ne laisse pas une pesée antidatée écraser le poids courant du profil", async () => {
    const { agent } = await onboardedAgent();
    await agent.post('/api/weight').send({ weightKg: 63.5, logDate: '2026-08-14' });
    await agent.post('/api/weight').send({ weightKg: 70, logDate: '2026-07-01' });

    const profil = await agent.get('/api/profile');
    expect(profil.body.weightKg).toBeCloseTo(63.5);
  });

  it('refuse un poids absurde et une logDate mal formée', async () => {
    const { agent } = await onboardedAgent();

    const poids = await agent.post('/api/weight').send({ weightKg: 900, logDate: '2026-08-14' });
    const negatif = await agent.post('/api/weight').send({ weightKg: -5, logDate: '2026-08-14' });
    const date = await agent.post('/api/weight').send({ weightKg: 65, logDate: 'hier' });

    expect(poids.status).toBe(400);
    expect(negatif.status).toBe(400);
    expect(date.status).toBe(400);
  });
});

describe('GET /api/weight', () => {
  beforeEach(resetDb);

  // Régression : la borne de la fenêtre était calculée en UTC alors que les logDate sont
  // en date locale, décalant la plage d'un jour (second audit, point 4).
  it('inclut le jour le plus ancien de la fenêtre et exclut celui juste avant', async () => {
    const { agent } = await onboardedAgent();
    await agent.post('/api/weight').send({ weightKg: 65, logDate: '2026-08-12' });
    await agent.post('/api/weight').send({ weightKg: 64, logDate: '2026-08-13' });
    await agent.post('/api/weight').send({ weightKg: 63, logDate: '2026-08-14' });

    const res = await agent.get('/api/weight').query({ days: 2, endDate: '2026-08-14' });

    expect(res.body.map((w) => w.logDate)).toEqual(['2026-08-13', '2026-08-14']);
  });

  it('renvoie les pesées du plus ancien au plus récent', async () => {
    const { agent } = await onboardedAgent();
    await agent.post('/api/weight').send({ weightKg: 63, logDate: '2026-08-14' });
    await agent.post('/api/weight').send({ weightKg: 65, logDate: '2026-08-12' });

    const res = await agent.get('/api/weight').query({ days: 30, endDate: '2026-08-14' });

    expect(res.body.map((w) => w.logDate)).toEqual(['2026-08-12', '2026-08-14']);
  });

  it('cloisonne les pesées entre utilisateurs', async () => {
    const { agent: alice } = await onboardedAgent('alice@test.dev');
    const { agent: bob } = await onboardedAgent('bob@test.dev');
    await alice.post('/api/weight').send({ weightKg: 65, logDate: '2026-08-14' });

    const res = await bob.get('/api/weight').query({ days: 30, endDate: '2026-08-14' });

    expect(res.body).toHaveLength(0);
  });
});
