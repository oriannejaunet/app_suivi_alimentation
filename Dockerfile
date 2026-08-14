FROM node:22-alpine AS build

WORKDIR /app

# Prisma a besoin d'openssl pour ses moteurs, y compris à la génération du client.
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci

COPY backend/ backend/
COPY frontend/ frontend/

RUN npx prisma generate --schema backend/prisma/schema.prisma
RUN npm run build -w frontend


FROM node:22-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

# `node_modules` est repris tel quel de l'étape de build : le CLI `prisma` est une
# devDependency mais reste nécessaire au démarrage pour `migrate deploy`, et sa version
# doit rester strictement alignée sur celle de @prisma/client.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Le point de montage est créé et attribué ici : Docker aligne les droits du volume
# nommé sur ceux du répertoire présent dans l'image.
RUN mkdir -p /data && chown node:node /data
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "backend/src/index.js"]
