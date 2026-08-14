import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app, resetDb } from '../helpers/api.js';

// Ce fichier est isolé volontairement : le MemoryStore d'express-rate-limit vit aussi
// longtemps que l'instance d'app, et vitest recharge les modules par fichier de test.
// Consommer le quota ici ne peut donc pas faire échouer les autres fichiers.
const LIMIT = 20;

describe('limitation de débit sur /api/auth', () => {
  beforeEach(resetDb);

  it('bloque en 429 au-delà du quota et annonce les en-têtes standard', async () => {
    let dernier;
    for (let i = 0; i < LIMIT; i++) {
      dernier = await request(app)
        .post('/api/auth/login')
        .send({ email: `inconnu${i}@test.dev`, password: 'motdepasse123' });
      expect(dernier.status, `requête ${i + 1}`).toBe(401);
    }

    // Les en-têtes `RateLimit-*` doivent rester présents : `standardHeaders: true` a changé
    // de sémantique en v8, et c'est le seul moyen pour un client de connaître son quota.
    expect(dernier.headers['ratelimit-limit'] ?? dernier.headers['ratelimit']).toBeDefined();
    expect(dernier.headers['x-ratelimit-limit']).toBeUndefined();

    const bloque = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inconnu@test.dev', password: 'motdepasse123' });

    expect(bloque.status).toBe(429);
  });

  it('ne limite pas les routes hors /api/auth', async () => {
    for (let i = 0; i < LIMIT + 1; i++) {
      const res = await request(app).get('/api/nope');
      expect(res.status, `requête ${i + 1}`).toBe(404);
    }
  });
});
