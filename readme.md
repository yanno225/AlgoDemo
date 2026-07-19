# AlgoDémo — Backend

API backend de l'application mobile de veille citoyenne **AlgoDémo** (Laboratoire Ouest-Méditerranée — Fondation de l'Innovation pour la Démocratie).

**Stack :** NestJS · TypeScript (strict) · PostgreSQL · TypeORM (migrations) · Swagger

## Prérequis

- Node.js ≥ 20 + npm
- Docker Desktop (pour PostgreSQL)

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier d'environnement
#    (PowerShell : Copy-Item .env.example .env)
cp .env.example .env

# 3. Démarrer PostgreSQL 16
docker compose up -d

# 4. Appliquer les migrations (le schéma n'évolue QUE par migrations)
npm run migration:run

# 5. Insérer le référentiel officiel (5 thématiques + critères du CDC §5)
npm run seed

# 6. Lancer l'API en mode watch
npm run start:dev
```

API : http://localhost:3000 — Documentation Swagger : http://localhost:3000/api/docs

## Scripts utiles

| Commande | Rôle |
|---|---|
| `npm run start:dev` | API en mode développement (rechargement auto) |
| `npm run build` | Compilation de production |
| `npm run migration:run` | Applique les migrations en attente |
| `npm run migration:revert` | Annule la dernière migration |
| `npm run migration:generate -- src/database/migrations/NomMigration` | Génère une migration à partir du diff entités/schéma |
| `npm run seed` | Seed idempotent du référentiel |

## Authentification — ⚠️ provisoire

Le module Auth (JWT, 2FA, RGPD) **n'est pas encore implémenté** (périmètre Dev A).
En attendant, les routes protégées utilisent un guard de développement qui lit le
rôle dans l'en-tête `X-Debug-Role` :

```bash
curl -X POST http://localhost:3000/thematiques \
  -H "Content-Type: application/json" \
  -H "X-Debug-Role: ADMIN" \
  -d '{"libelle": "Test"}'
```

Rôles disponibles (enum partagé `src/common/enums/role.enum.ts`, CDC §9.3) :
`UTILISATEUR` · `POINT_FOCAL` · `ADMIN`.

**À remplacer par le guard JWT** en conservant le contrat : lecture de la
métadonnée `@Roles()`, routes sans `@Roles()` publiques, utilisateur déposé sur
`request.user`. Voir `src/common/guards/roles.guard.ts`.

## Module Référentiel (CDC §5)

Hiérarchie **Thématique › Critère › Indicateur** — socle consommé par le Feed
(filtres), les Avis, les Débats et la Fiche-pays.

| Route | Accès | Description |
|---|---|---|
| `GET /thematiques` · `/criteres` · `/indicateurs` | Public | Listes |
| `GET /thematiques/arbre` | Public | Hiérarchie complète (filtres, Fiche-pays) |
| `GET /{ressource}/:id` | Public | Détail |
| `POST` / `PATCH` / `DELETE` | `ADMIN` | CRUD (suppressions en cascade) |

## Structure du projet

```
src/
├── main.ts                  # ValidationPipe global, Swagger /api/docs, filtre d'exceptions
├── app.module.ts
├── config/                  # Validation du .env + DataSource TypeORM (app + CLI)
├── common/                  # Partagé entre les 2 devs : enum Role, @Roles(), RolesGuard, filtre
├── database/
│   ├── migrations/
│   └── seeds/
└── modules/
    └── referentiel/         # Thématique › Critère › Indicateur (entités, DTOs, services, contrôleurs)
```

Modules à venir : `debats` (WebSocket temps réel), `fiche-pays` (+ synthèses IA),
`collecte` (Dev B) · `auth`, `feed`, `consultations`, `notifications` (Dev A).
