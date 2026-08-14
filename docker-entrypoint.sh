#!/bin/sh
set -e

# La base SQLite vit sur un volume : le schéma doit être appliqué à chaque démarrage,
# pas au build, sinon un volume neuf démarre sans tables.
npx prisma migrate deploy --schema backend/prisma/schema.prisma

exec "$@"
