import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/lib/prisma.js';

export const app = createApp();

// Ordre imposé par les clés étrangères : les enfants avant User.
const TABLES = ['FoodLog', 'WeightLog', 'CustomFood', 'FoodCache', 'User'];

export async function resetDb() {
  for (const table of TABLES) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
  }
}

export const VALID_PASSWORD = 'motdepasse123';

// `request.agent` conserve le cookie httpOnly entre les appels, exactement comme le
// navigateur : c'est le seul moyen de tester les routes protégées de bout en bout.
export async function registerAgent(email = 'user@test.dev') {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({ email, password: VALID_PASSWORD });
  if (res.status !== 201) {
    throw new Error(`register a échoué (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return { agent, user: res.body };
}

const COMPLETE_PROFILE = {
  heightCm: 170,
  weightKg: 65,
  age: 30,
  gender: 'female',
  activityLevel: 'moderate',
  goal: 'lose',
  goalRateKcal: -500,
};

export async function onboardedAgent(email = 'user@test.dev', overrides = {}) {
  const { agent } = await registerAgent(email);
  const res = await agent.put('/api/profile').send({ ...COMPLETE_PROFILE, ...overrides });
  if (res.status !== 200) {
    throw new Error(`onboarding a échoué (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return { agent, user: res.body };
}
