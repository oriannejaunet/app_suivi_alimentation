#!/bin/sh
set -e

# La base SQLite vit sur un volume : le schéma doit être appliqué à chaque démarrage,
# pas au build, sinon un volume neuf démarre sans tables.
# Lancé depuis backend/ car Prisma 7 cherche `prisma.config.js` dans le répertoire courant.
(cd backend && npx prisma migrate deploy)

exec "$@"
