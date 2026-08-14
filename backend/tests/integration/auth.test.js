import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app, resetDb, registerAgent, VALID_PASSWORD } from '../helpers/api.js';

describe('POST /api/auth/register', () => {
  beforeEach(resetDb);

  it('crée le compte, pose un cookie httpOnly et ne renvoie jamais le hash', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'nouveau@test.dev', password: VALID_PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('nouveau@test.dev');
    expect(res.body.passwordHash).toBeUndefined();

    const cookie = res.headers['set-cookie'].find((c) => c.startsWith('token='));
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('refuse un email déjà pris', async () => {
    await registerAgent('doublon@test.dev');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'doublon@test.dev', password: VALID_PASSWORD });

    expect(res.status).toBe(409);
  });

  it('refuse un mot de passe trop court', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'court@test.dev', password: 'court' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(resetDb);

  it('accepte les bons identifiants', async () => {
    await registerAgent('connexion@test.dev');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'connexion@test.dev', password: VALID_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'].some((c) => c.startsWith('token='))).toBe(true);
  });

  it('renvoie le même 401 pour un email inconnu et pour un mauvais mot de passe', async () => {
    await registerAgent('connexion@test.dev');

    const inconnu = await request(app)
      .post('/api/auth/login')
      .send({ email: 'personne@test.dev', password: VALID_PASSWORD });
    const mauvais = await request(app)
      .post('/api/auth/login')
      .send({ email: 'connexion@test.dev', password: 'mauvais-mot-de-passe' });

    expect(inconnu.status).toBe(401);
    expect(mauvais.status).toBe(401);
    // Ne pas distinguer les deux cas évite d'énumérer les comptes existants.
    expect(inconnu.body.error).toBe(mauvais.body.error);
  });
});

describe('POST /api/auth/logout', () => {
  beforeEach(resetDb);

  // Régression : la route était protégée par requireAuth, donc une session déjà
  // expirée ne pouvait plus jamais être purgée (audit, point 1).
  it('reste accessible sans session valide', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(204);
  });

  it('reste accessible avec un cookie invalide et efface quand même le cookie', async () => {
    const res = await request(app).post('/api/auth/logout').set('Cookie', 'token=nimportequoi');

    expect(res.status).toBe(204);
    expect(res.headers['set-cookie'].some((c) => c.startsWith('token=;'))).toBe(true);
  });

  it('invalide la session côté client', async () => {
    const { agent } = await registerAgent('deco@test.dev');
    await agent.post('/api/auth/logout');

    const apres = await agent.get('/api/auth/me');
    expect(apres.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  beforeEach(resetDb);

  it('renvoie 401 sans cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('renvoie 401 sur un cookie forgé', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'token=pas.un.jwt');
    expect(res.status).toBe(401);
  });

  it('restaure la session à partir du cookie', async () => {
    const { agent, user } = await registerAgent('session@test.dev');
    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
  });
});

describe('protection des routes', () => {
  beforeEach(resetDb);

  it('refuse toutes les routes métier sans session', async () => {
    const routes = [
      ['get', '/api/profile'],
      ['get', '/api/foodlog'],
      ['get', '/api/stats/summary'],
      ['get', '/api/weight'],
      ['get', '/api/food/search?q=pain'],
    ];

    for (const [method, url] of routes) {
      const res = await request(app)[method](url);
      expect(res.status, `${method.toUpperCase()} ${url}`).toBe(401);
    }
  });
});
