import 'dotenv/config';

// Prisma 7 refuse `url` dans le bloc datasource du schéma : la chaîne de connexion vit
// ici pour Migrate, et le client la reçoit via son adapter (voir src/lib/prisma.js).
export default {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
