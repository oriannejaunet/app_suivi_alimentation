import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: './tests/setup/globalSetup.js',
    setupFiles: ['./tests/setup/env.js'],
    // Les tests d'intégration partagent un seul fichier SQLite et vident les tables
    // entre chaque cas : les exécuter en parallèle les ferait s'écraser mutuellement.
    fileParallelism: false,
  },
});
