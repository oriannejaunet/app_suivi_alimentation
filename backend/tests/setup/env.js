import { TEST_DATABASE_URL } from './dbPath.js';

// Doit être positionné avant que `config/env.js` et `lib/prisma.js` ne soient importés :
// le client Prisma lit DATABASE_URL à l'instanciation. `dotenv/config` n'écrase pas une
// variable déjà définie, donc un `backend/.env` local ne peut pas détourner les tests.
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = 'secret-de-test-suffisamment-long-pour-jsonwebtoken';
process.env.NODE_ENV = 'test';
