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

## Module Fiche-pays (CDC §3.6) — étape 1

La fiche d'un pays = le squelette du Référentiel + les **valeurs mesurées**
(`valeur`, `dateMesure`, `paysOuZone`, `source`), triées de la plus récente à la
plus ancienne. Les valeurs sont saisies par l'admin ou importées par CSV, en
attendant le pipeline scraping → IA → validation admin.

| Route | Accès | Description |
|---|---|---|
| `GET /fiche-pays/{pays}` | Public | Fiche complète du pays (insensible à la casse) |
| `GET /valeurs-indicateurs?pays=&indicateurId=` | Public | Liste filtrable des valeurs |
| `POST` / `PATCH` / `DELETE /valeurs-indicateurs` | `ADMIN` | Saisie/correction manuelle |
| `POST /valeurs-indicateurs/import` | `ADMIN` | Import CSV en lot (multipart, champ `fichier`) |

Format CSV (séparateur `;` ou `,` ; en-tête obligatoire ; doublons ignorés ;
virgule décimale acceptée avec `;`) — **enregistrer le fichier en UTF-8** :

```csv
indicateurId;valeur;dateMesure;paysOuZone;source
<uuid-indicateur>;66,8;2024-01-01;Côte d'Ivoire;Annuaire statistique 2024
```

Le seed insère le **référentiel officiel complet** (86 indicateurs des ateliers
ESATIC) et des **valeurs de démonstration** pour la Côte d'Ivoire (14 valeurs,
source marquée « à remplacer »).

## Synthèses IA — ⚠️ génération provisoire (stub)

Chaque thématique de la fiche-pays peut recevoir une **synthèse rédigée**,
générée par le service IA puis **validée par un humain** avant publication :

```
POST /syntheses/generer (ADMIN)          → statut EN_ATTENTE_VALIDATION
PATCH /syntheses/{id}/valider (ADMIN)    → PUBLIEE (texteCorrige facultatif)
PATCH /syntheses/{id}/rejeter (ADMIN)    → REJETEE (traçabilité)
GET  /syntheses?statut=&pays= (ADMIN)    → file de validation
```

Seule la synthèse **PUBLIEE** la plus récente de chaque thématique apparaît
dans `GET /fiche-pays/{pays}` (champ `synthese`).

Le service IA est un **stub** (`src/modules/ia/stub-ia.service.ts`) : texte
mécanique, aucun appel externe. Pour brancher la vraie IA (Claude), implémenter
`IaService` avec le SDK Anthropic et changer **une ligne** dans
`src/modules/ia/ia.module.ts`. Le contrat est décrit dans
`src/modules/ia/ia-service.interface.ts` (synthèses + future extraction de
valeurs depuis les textes scrapés).

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
    ├── referentiel/         # Thématique › Critère › Indicateur (entités, DTOs, services, contrôleurs)
    ├── fiche-pays/          # ValeurIndicateur + consultation par pays + import CSV + synthèses IA
    └── ia/                  # Service IA partagé (contrat) — stub à remplacer par Claude
```

Modules à venir : `debats` (WebSocket temps réel), `collecte` (scraping) (Dev B)
· `auth`, `feed`, `consultations`, `notifications` (Dev A).
