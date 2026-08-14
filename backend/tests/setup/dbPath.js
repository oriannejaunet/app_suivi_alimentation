import path from 'node:path';

// Chemin partagé entre le globalSetup (qui applique les migrations) et les workers de
// test (qui pointent DATABASE_URL dessus). Passer par un module commun évite d'avoir à
// transmettre une variable d'environnement entre deux processus.
export const TEST_DB_FILE = path.join(process.cwd(), '.tmp', 'test.db');
export const TEST_DATABASE_URL = `file:${TEST_DB_FILE}`;
