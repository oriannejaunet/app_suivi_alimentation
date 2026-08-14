import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { env } from '../config/env.js';

// Prisma 7 ne lit plus l'URL depuis le schéma : le client reçoit un driver adapter, qui
// ouvre lui-même la base. `env.databaseUrl` est donc devenu obligatoire au démarrage.
const adapter = new PrismaBetterSqlite3({ url: env.databaseUrl });

export const prisma = new PrismaClient({ adapter });
