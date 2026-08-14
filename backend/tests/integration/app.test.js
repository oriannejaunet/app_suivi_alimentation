import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app, resetDb, onboardedAgent } from '../helpers/api.js';

describe('routage applicatif', () => {
  beforeEach(resetDb);

  // Régression : le catch-all SPA capturait aussi /api/*, renvoyant du HTML en 200 sur un
  // endpoint inexistant, ce qu'axios interprétait comme un succès (audit, point 8).
  it('répond 404 JSON sur une route /api inconnue', async () => {
    const res = await request(app).get('/api/nope');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Endpoint inconnu' });
  });

  it('répond 404 JSON sur une sous-route inconnue, session valide à l\'appui', async () => {
    const { agent } = await onboardedAgent();
    const res = await agent.get('/api/foodlog/inconnu/trop/profond');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
  });

  // Un routeur protégé répond 401 avant même de chercher la route : l'ordre importe,
  // il évite de révéler quelles sous-routes existent à un appelant non authentifié.
  it('répond 401 avant 404 sur un routeur protégé sans session', async () => {
    const res = await request(app).get('/api/foodlog/inconnu/trop/profond');

    expect(res.status).toBe(401);
  });
});
