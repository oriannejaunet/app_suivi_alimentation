# Suivi Alimentation

Application web responsive de suivi alimentaire : scannez vos aliments (ou
recherchez-les), la quantité saisie calcule automatiquement les calories et
macros, et un questionnaire personnel (taille, poids, âge, activité,
objectif) détermine votre déficit ou surplus calorique quotidien.

## Fonctionnalités

- **Scan code-barres** via la caméra (`@zxing/browser`) avec récupération des
  infos nutritionnelles depuis [Open Food Facts](https://world.openfoodfacts.org)
- **Recherche par nom** en alternative au scan, avec possibilité de **créer un
  aliment personnalisé** (nom + valeurs nutritionnelles pour 100 g) si un
  produit est introuvable — réutilisable ensuite dans vos futures recherches
- **Journal quotidien** : ajout d'aliments avec quantité, calcul automatique
  des calories et macros, suppression d'entrées
- **Questionnaire personnel** (taille, poids, âge, sexe, niveau d'activité,
  objectif) pour calculer le métabolisme de base (BMR), la dépense
  énergétique totale (TDEE) et l'objectif calorique quotidien
- **Objectifs de macros personnalisés** (protéines/glucides/lipides) dérivés
  du poids et de l'objectif, avec suivi visuel par rapport aux quantités
  consommées
- **Suivi du poids** dans le temps avec graphique d'évolution
- **Historique des calories** sur les 14 derniers jours comparé à l'objectif
- Comptes utilisateurs multiples avec authentification par cookie sécurisé
- Interface responsive, pensée mobile en premier (le scan se fait au
  téléphone)

## Stack technique

- **Backend** : Node.js, Express, Prisma ORM, SQLite, JWT (cookie httpOnly),
  Zod
- **Frontend** : React, Vite, React Router, Tailwind CSS
- **Base alimentaire** : API publique [Open Food Facts](https://world.openfoodfacts.org)

## Démarrage

### Prérequis

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Configuration

Copiez `backend/.env.example` vers `backend/.env` et renseignez un
`JWT_SECRET` (une longue chaîne aléatoire) :

```bash
cp backend/.env.example backend/.env
```

### Base de données

```bash
cd backend
npx prisma migrate dev
```

### Lancer l'application en développement

Depuis la racine du projet :

```bash
npm run dev
```

- Backend : http://localhost:3000
- Frontend : http://localhost:5173

> **Scan caméra** : `getUserMedia` nécessite un contexte sécurisé (HTTPS ou
> `localhost`). Pour tester le scan sur un téléphone en développement,
> utilisez un tunnel HTTPS (ex. ngrok) ou testez après déploiement.

### Tests

```bash
npm run test
```

### Build de production

```bash
npm run build -w frontend
```

En production, le backend Express sert le build du frontend en statique
(voir `backend/src/app.js`), donc un seul serveur suffit à déployer
l'ensemble.

### Lancer avec Docker

Un seul conteneur, qui reprend exactement ce fonctionnement : le frontend est
compilé au build de l'image, puis servi par le backend.

```bash
cp .env.docker.example .env        # puis remplacez JWT_SECRET
docker compose up -d --build       # http://localhost:3000
```

Les migrations Prisma sont appliquées à chaque démarrage par
`docker-entrypoint.sh`, car la base SQLite vit sur le volume `db` et non dans
l'image.

```bash
docker compose logs -f             # suivre les logs
docker compose down                # arrêter, en conservant la base
docker compose down -v             # arrêter et supprimer la base
```

## Structure du projet

```
app_suivi_alimentation/
├── backend/     # API Express + Prisma/SQLite
└── frontend/    # Application React + Vite
```

Voir [CLAUDE.md](./CLAUDE.md) pour le détail de l'architecture.
