import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { TEST_DB_FILE, TEST_DATABASE_URL } from './dbPath.js';

export function setup() {
  fs.mkdirSync(path.dirname(TEST_DB_FILE), { recursive: true });
  fs.rmSync(TEST_DB_FILE, { force: true });

  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'pipe',
  });
}

export function teardown() {
  fs.rmSync(TEST_DB_FILE, { force: true });
}
