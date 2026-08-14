import { defineConfig, devices } from '@playwright/test';

// Les tests visent le conteneur Docker, donc le build de production : c'est le seul moyen
// de vérifier le bundle réellement livré (React compilé, CSS Tailwind purgé) et non le
// serveur de développement, qui se comporte différemment.
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  // Un seul worker : les tests partagent la base SQLite du conteneur.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Mobile-first : l'app est conçue pour cette largeur, la tester en 1280px passerait
    // à côté de la navigation basse et des mises en page à une colonne.
    ...devices['Pixel 7'],
  },
});
