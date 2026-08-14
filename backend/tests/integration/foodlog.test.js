import { describe, it, expect, beforeEach } from 'vitest';
import { resetDb, onboardedAgent } from '../helpers/api.js';

const POMME = {
  foodName: 'Pomme',
  quantityG: 200,
  caloriesPer100g: 52,
  proteinPer100g: 0.3,
  carbsPer100g: 14,
  fatPer100g: 0.2,
};

describe('POST /api/foodlog', () => {
  beforeEach(resetDb);

  it('stocke les valeurs absolues calculées, pas les valeurs pour 100 g', async () => {
    const { agent } = await onboardedAgent();
    const res = await agent.post('/api/foodlog').send({ ...POMME, logDate: '2026-08-14' });

    expect(res.status).toBe(201);
    expect(res.body.calories).toBeCloseTo(104);
    expect(res.body.proteinG).toBeCloseTo(0.6);
    expect(res.body.carbsG).toBeCloseTo(28);
    expect(res.body.fatG).toBeCloseTo(0.4);
    expect(res.body.quantityG).toBe(200);
  });

  it('conserve la logDate envoyée par le client', async () => {
    const { agent } = await onboardedAgent();
    const res = await agent.post('/api/foodlog').send({ ...POMME, logDate: '2025-01-02' });

    expect(res.body.logDate).toBe('2025-01-02');
  });

  it('laisse les macros à null quand elles ne sont pas fournies', async () => {
    const { agent } = await onboardedAgent();
    const res = await agent.post('/api/foodlog').send({
      foodName: 'Aliment inconnu',
      quantityG: 100,
      caloriesPer100g: 200,
      logDate: '2026-08-14',
    });

    expect(res.status).toBe(201);
    expect(res.body.calories).toBeCloseTo(200);
    expect(res.body.proteinG).toBeNull();
  });

  it('refuse une quantité négative et une logDate mal formée', async () => {
    const { agent } = await onboardedAgent();

    const quantite = await agent.post('/api/foodlog').send({ ...POMME, quantityG: -5 });
    const date = await agent.post('/api/foodlog').send({ ...POMME, logDate: '14/08/2026' });

    expect(quantite.status).toBe(400);
    expect(date.status).toBe(400);
  });
});

describe('GET /api/foodlog', () => {
  beforeEach(resetDb);

  it('ne renvoie que la journée demandée', async () => {
    const { agent } = await onboardedAgent();
    await agent.post('/api/foodlog').send({ ...POMME, logDate: '2026-08-14' });
    await agent.post('/api/foodlog').send({ ...POMME, logDate: '2026-08-13' });

    const res = await agent.get('/api/foodlog').query({ logDate: '2026-08-14' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].logDate).toBe('2026-08-14');
  });

  it('cloisonne les entrées entre utilisateurs', async () => {
    const { agent: alice } = await onboardedAgent('alice@test.dev');
    const { agent: bob } = await onboardedAgent('bob@test.dev');
    await alice.post('/api/foodlog').send({ ...POMME, logDate: '2026-08-14' });

    const res = await bob.get('/api/foodlog').query({ logDate: '2026-08-14' });

    expect(res.body).toHaveLength(0);
  });

  // Régression : `?logDate[not]=x` arrivait dans Prisma comme un opérateur de filtre et
  // renvoyait tout l'historique au lieu d'une seule journée (audit, point 6).
  it('rejette un paramètre de requête transformé en objet', async () => {
    const { agent } = await onboardedAgent();
    await agent.post('/api/foodlog').send({ ...POMME, logDate: '2026-08-14' });
    await agent.post('/api/foodlog').send({ ...POMME, logDate: '2026-08-13' });

    const res = await agent.get('/api/foodlog?logDate[not]=2026-08-14');

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/foodlog/:id', () => {
  beforeEach(resetDb);

  it('supprime sa propre entrée', async () => {
    const { agent } = await onboardedAgent();
    const cree = await agent.post('/api/foodlog').send({ ...POMME, logDate: '2026-08-14' });

    const res = await agent.delete(`/api/foodlog/${cree.body.id}`);
    expect(res.status).toBe(204);

    const restant = await agent.get('/api/foodlog').query({ logDate: '2026-08-14' });
    expect(restant.body).toHaveLength(0);
  });

  it("renvoie 404 sur l'entrée d'un autre utilisateur, sans la supprimer", async () => {
    const { agent: alice } = await onboardedAgent('alice@test.dev');
    const { agent: bob } = await onboardedAgent('bob@test.dev');
    const cree = await alice.post('/api/foodlog').send({ ...POMME, logDate: '2026-08-14' });

    const res = await bob.delete(`/api/foodlog/${cree.body.id}`);
    expect(res.status).toBe(404);

    const chezAlice = await alice.get('/api/foodlog').query({ logDate: '2026-08-14' });
    expect(chezAlice.body).toHaveLength(1);
  });

  // Régressions : un id non numérique, puis un id hors de l'`Int` 32 bits de Prisma,
  // remontaient tous les deux en 500 au lieu du 404 attendu (audit, point 10).
  it('renvoie 404 sur un identifiant invalide plutôt que 500', async () => {
    const { agent } = await onboardedAgent();

    for (const id of ['abc', '0', '-1', '1.5', '99999999999', '1e30']) {
      const res = await agent.delete(`/api/foodlog/${id}`);
      expect(res.status, `id=${id}`).toBe(404);
    }
  });
});
