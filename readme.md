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

## Module Auth & Identité (CDC §9.3)

JWT (access + refresh), RBAC, 2FA (TOTP) et primitives RGPD. Le guard partagé
`src/common/guards/roles.guard.ts` vérifie désormais un vrai JWT (le guard de
développement `X-Debug-Role` a été retiré) — contrat inchangé : lecture de la
métadonnée `@Roles()`, routes sans `@Roles()` publiques, utilisateur déposé sur
`request.user`.

Rôles (enum partagé `src/common/enums/role.enum.ts`, CDC §9.3) :
`UTILISATEUR` · `POINT_FOCAL` · `ADMIN`.

| Route | Accès | Description |
|---|---|---|
| `POST /auth/register` | Public | Inscription — envoie un code OTP (email/SMS) |
| `POST /auth/verify-email` | Public | Confirme l'email avec le code reçu |
| `POST /auth/resend-otp` | Public | Renvoie un nouveau code |
| `POST /auth/login` | Public | Connexion — access + refresh token (`{deuxFaRequis:true}` si 2FA activée) |
| `POST /auth/refresh` | Public | Renouvelle les tokens |
| `POST /auth/logout` | Authentifié | Révoque le refresh token courant |
| `GET /auth/me` | Authentifié | Profil courant |
| `POST /auth/2fa/enable` · `/confirm` · `/disable` | Authentifié | Activation TOTP (2FA obligatoire pour les votes, §6.3) |
| `PATCH /auth/consent` | Authentifié | RGPD — consentement notifications / politique de confidentialité |
| `POST /auth/anonymisation` | Authentifié | RGPD — `demanderAnonymisation()` (irréversible) |
| `GET /auth/users` | `ADMIN` | Liste des comptes |
| `PATCH /auth/users/:id/valider` · `/bloquer` · `/role` | `ADMIN` | Validation, blocage, attribution/certification point focal |

Exemple :

```bash
curl -X POST http://localhost:3000/thematiques \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"libelle": "Test"}'
```

**Envoi OTP par email — branché (SMTP)** : configurer les variables `SMTP_*`
dans le `.env` (voir `.env.example` : Gmail « mot de passe d'application » ou
Brevo). Sans configuration SMTP, le serveur bascule en **MODE DEV** : le code
s'affiche dans les logs au lieu d'être envoyé (interdit avec de vrais
utilisateurs). Quand le SMTP est configuré, le code n'est jamais journalisé.
L'envoi par SMS reste à brancher (fournisseur à choisir par l'organisation).

## Module Feed / Contenu (CDC §6.1-§6.2, §9.4)

Articles, fiches et vidéos rattachés à une thématique du Référentiel. Un
contenu créé par un point focal/admin n'est visible dans `GET /feed` qu'une
fois publié (`PATCH /feed/:id/publier`).

| Route | Accès | Description |
|---|---|---|
| `GET /feed` | Public | Paginé — filtres `thematiqueId`, `type`, `statutVerification`, `telechargeable`, `dateDebut`/`dateFin`, recherche `q` (mot-clé), tri `date`\|`pertinence` |
| `GET /feed/offline` | Public | Package hors-ligne : contenus publiés marqués `telechargeable` |
| `GET /feed/historique` | Authentifié | Historique de lecture de l'utilisateur courant |
| `GET /feed/:id` | Public | Détail (médias, audio) |
| `POST /feed` | `POINT_FOCAL`, `ADMIN` | Créer un contenu (non publié par défaut) |
| `PATCH /feed/:id` | `POINT_FOCAL`, `ADMIN` | Modifier (thématique, statutVerification, estOfficiel, source...) |
| `PATCH /feed/:id/publier` · `/depublier` | `POINT_FOCAL`, `ADMIN` | Publication |
| `POST /feed/:id/audio` | `POINT_FOCAL`, `ADMIN` | Génère l'audio TTS du contenu |
| `POST /feed/:id/lu` | Authentifié | Marquer comme lu (historique) |
| `DELETE /feed/:id` | `ADMIN` | Supprimer |
| `POST /feed/:id/signaler` | Authentifié | Signaler un contenu (fausse information, contenu inapproprié...) |
| `GET /feed/signalements` | `POINT_FOCAL`, `ADMIN` | File des signalements en attente |
| `PATCH /feed/signalements/:id/traiter` | `POINT_FOCAL`, `ADMIN` | `{action: "DEPUBLIER"\|"IGNORER"}` |

⚠️ **TTS/média non branché** : `TtsService` (`src/modules/feed/services/tts.service.ts`)
journalise la demande et renvoie une URL placeholder — à remplacer par le
`MediaService` partagé (socle transverse, S3 + TTS réel) avant mise en production.

**Contrat événementiel avec Dev B** : une fois le module Débats prêt, un résumé
de débat validé humainement doit être publié comme `Contenu` en émettant
`debat.resume.valide` (voir `src/modules/feed/events/debat-resume-valide.event.ts`
pour la forme exacte du payload et `DebatResumeListener` pour la réception).

## Module Consultations & Participation (CDC §6.2-§6.3)

Consultations citoyennes (projets de loi vulgarisés) à vote unique sécurisé, et
avis écrits rattachés au Référentiel, modérés avant publication.

| Route | Accès | Description |
|---|---|---|
| `GET /consultations` | Public | Liste — filtre `?statut=ouvertes\|cloturees\|toutes` |
| `GET /consultations/:id` | Public | Détail + options de vote |
| `GET /consultations/:id/resultats` | Public | Résultats agrégés — `404` tant que non publiés |
| `POST /consultations` | `POINT_FOCAL`, `ADMIN` | Créer (titre, description, résumé vulgarisé, dates, options de vote) |
| `PATCH /consultations/:id` | `POINT_FOCAL`, `ADMIN` | Modifier (options non modifiables après création) |
| `PATCH /consultations/:id/resultats/publier` | `ADMIN` | Publier les résultats agrégés |
| `POST /consultations/:id/vote` | Authentifié | Vote unique — **2FA obligatoire** (`codeOtp` requis, `403` si la 2FA du compte est désactivée, `409` si déjà voté) |
| `DELETE /consultations/:id` | `ADMIN` | Supprimer |
| `GET /avis` | Public | Avis **approuvés** — filtre `?thematiqueId` |
| `GET /avis/moderation` | `POINT_FOCAL`, `ADMIN` | File de modération (avis en attente) |
| `GET /avis/:id` | Public | Détail — `404` si non approuvé |
| `POST /avis` | Authentifié | Soumettre un avis (passe en modération, `EN_ATTENTE`) |
| `PATCH /avis/:id/moderer` | `POINT_FOCAL`, `ADMIN` | Approuver/rejeter (`{decision, motif?}`) |

## Module Notifications (CDC §3.0/§3.9)

Notifications in-app + déclenchement push, entièrement pilotées par événements
(`notif.*`, `@nestjs/event-emitter`) émis par les autres modules — jamais
d'appel direct entre modules. Toujours filtrées par consentement RGPD
(`User.consentementNotifications`, voir `PATCH /auth/consent`).

| Route | Accès | Description |
|---|---|---|
| `POST /notifications/devices` | Authentifié | Enregistrer le token push de l'appareil courant |
| `DELETE /notifications/devices/:token` | Authentifié | Désenregistrer un token (idempotent) |
| `GET /notifications` | Authentifié | Notifications de l'utilisateur courant |
| `PATCH /notifications/lues` | Authentifié | Marquer toutes comme lues |
| `PATCH /notifications/:id/lue` | Authentifié | Marquer une notification comme lue |

**Contrat d'événements `notif.*`** (voir `src/modules/notifications/events/notification.events.ts`) —
n'importe quel module (y compris les futurs modules Dev B) peut déclencher une
notification en émettant l'un de ces événements via `EventEmitter2` :

| Événement | Émis par | Portée |
|---|---|---|
| `notif.contenu.publie` | Feed (`FeedService.publier`) | Diffusion à tous les comptes consentants |
| `notif.resultats.publies` | Consultations (`publierResultats`) | Ciblée : les votants de la consultation |
| `notif.moderation` | Avis (`moderer`) | Ciblée : l'auteur de l'avis |
| `notif.debat.demarre` | *(Dev B, module Débats à venir)* | Diffusion ou ciblée (`userIds` optionnel dans le payload) |

⚠️ **Push non branché** : `PushService` (`src/modules/notifications/services/push.service.ts`)
journalise l'envoi vers les appareils enregistrés — à remplacer par de vrais
appels FCM/APNs avant mise en production.

## Back-office / Modération transverse (CDC §3.10)

Dashboard, file de modération unifiée et journal d'audit — agrège les modules
Feed, Consultations et Auth sans dupliquer leur logique métier.

| Route | Accès | Description |
|---|---|---|
| `GET /back-office/stats` | `ADMIN` | Utilisateurs (par rôle), contenus, consultations, avis, signalements |
| `GET /back-office/moderation` | `POINT_FOCAL`, `ADMIN` | File unifiée : avis en attente + contenus non vérifiés + signalements en attente, triés par ancienneté |
| `GET /back-office/audit` | `ADMIN` | Dernières actions mutatives (`?limite=100`) |

**Journal d'audit automatique** : `AuditInterceptor` (`src/modules/back-office/interceptors/audit.interceptor.ts`)
est enregistré comme `APP_INTERCEPTOR` global — il journalise toute requête
`POST`/`PATCH`/`PUT`/`DELETE` effectuée par un utilisateur authentifié, quel
que soit le module. Couvre donc automatiquement les futurs modules (Débats,
Fiche-pays côté Dev B) sans modification.

**Gestion des rôles / certification des points focaux** : déjà couverte par
`PATCH /auth/users/:id/role` (module Auth, voir plus haut) — pas dupliquée ici.

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

## Service IA (Mistral AI, avec repli stub)

Les générations de texte (synthèses fiche-pays, résumés de débats) passent par
un service IA partagé (`src/modules/ia`). Le fournisseur est choisi
automatiquement au démarrage :

- **`MISTRAL_API_KEY` renseignée** → Mistral AI (entreprise française, serveurs
  européens — cohérent RGPD). Clé gratuite sur https://console.mistral.ai.
- **sans clé** → stub (texte mécanique de démonstration), pour développer
  hors-ligne. Le log au démarrage indique lequel est actif.

Pour changer de fournisseur plus tard : écrire une classe implémentant
`IaService` et l'ajouter à la factory de `src/modules/ia/ia.module.ts`.

## Transcription en direct (verbatim du débat)

Pendant le live, le navigateur des intervenants convertit leur voix en texte
(reconnaissance vocale, `fr-FR`) et envoie chaque phrase au backend via
l'événement WebSocket `transcription`. Les segments (attribués à chaque
intervenant, horodatés) forment le **verbatim** du débat, diffusé en direct à
la salle (`transcription.maj`) et **stocké** (`transcription_segments`).

C'est cette transcription — ce qui a été réellement **dit** — qui sert de base
factuelle au résumé IA. Le résumé a l'instruction stricte de ne rien inventer :
il s'appuie uniquement sur le verbatim et les votes. (Reconnaissance vocale
disponible sur Chrome ; une transcription serveur plus robuste, type Whisper,
pourra la remplacer plus tard sans changer le reste.)

## Résumés post-débat (CDC §6.4 → Feed)

Après un débat **terminé**, le staff génère un résumé (IA) basé sur le
**verbatim** (transcription) et les votes, le valide, et il est **publié
automatiquement dans le Feed** (événement `debat.resume.valide` — dernier
contrat inter-équipes).

| Route | Accès | Description |
|---|---|---|
| `POST /debats/:id/resume/generer` | `POINT_FOCAL`/`ADMIN` | Génère le résumé (débat terminé) |
| `GET /debats/resumes/liste?debatId=&statut=` | `POINT_FOCAL`/`ADMIN` | File de validation |
| `GET /debats/resumes/:resumeId` | `POINT_FOCAL`/`ADMIN` | Détail (brouillon IA + version finale) |
| `PATCH /debats/resumes/:resumeId/valider` | `POINT_FOCAL`/`ADMIN` | Publie (texteCorrige facultatif) → émet `debat.resume.valide` |
| `PATCH /debats/resumes/:resumeId/rejeter` | `POINT_FOCAL`/`ADMIN` | Rejette (traçabilité) |

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

## Module Débats & Lives (CDC §6.4)

Sessions live encadrées : votes en direct sur des affirmations, signalements de
fausses informations, replay. REST pour la gestion, **WebSocket (socket.io,
namespace `/debats`)** pour la salle.

| Route | Accès | Description |
|---|---|---|
| `GET /debats?filtre=a-venir\|en-cours\|termines` | Public | Liste |
| `GET /debats/:id` | Public | Détail + affirmations |
| `POST` / `PATCH` / `DELETE /debats` | `POINT_FOCAL`/`ADMIN` (DELETE : ADMIN) | Planification |
| `PATCH /debats/:id/demarrer` · `/cloturer` | `POINT_FOCAL`, `ADMIN` | Cycle du live — `demarrer` émet `notif.debat.demarre` |
| `PATCH /debats/:id/replay` | `POINT_FOCAL`, `ADMIN` | URL d'archive (débat terminé) |
| `POST /debats/:id/affirmations` · `PATCH /debats/affirmations/:id/fermer` | `POINT_FOCAL`, `ADMIN` | Affirmations mises au vote (diffusées en direct) |
| `GET /debats/:id/signalements` · `PATCH /debats/signalements/:id/traiter` | `POINT_FOCAL`, `ADMIN` | Modération des signalements |

WebSocket — client : `io('/debats', { auth: { token: '<accessToken>' } })`.
Événements client → serveur : `rejoindre`, `voter`, `signaler`.
Serveur → salle : `participants.maj`, `affirmation.nouvelle`, `vote.maj`,
`affirmation.fermee`, `debat.demarre`, `debat.cloture`, `signalement.nouveau`
(staff). Détail des payloads : `src/modules/debats/gateway/debats.gateway.ts`.

### Vidéo en direct (LiveKit, auto-hébergé)

Débat en visio intégré à l'application (scénario « le public suit à distance ») :
le modérateur et les intervenants publient caméra/micro, le public regarde et
vote. Le serveur vidéo **LiveKit** tourne dans `docker-compose` ; le backend
délivre les jetons d'accès selon le rôle de participation.

| Route | Accès | Description |
|---|---|---|
| `GET /debats/:id/live-token` | Authentifié | Jeton LiveKit : `canPublish=true` (modérateur/intervenant), écoute seule (public) |

Config `.env` : `LIVEKIT_URL` · `LIVEKIT_API_KEY` · `LIVEKIT_API_SECRET`
(doivent correspondre au conteneur `livekit`). En dev, les valeurs par défaut
(`devkey`/`devsecret…`, mode `--dev`) suffisent. **En production** : générer des
clés fortes et héberger LiveKit en ligne (serveur de l'organisation, §9.2) pour
qu'un public distant puisse s'y connecter.

### 🧪 Test en salle (conditions réelles, plusieurs téléphones)

1. Lancer l'API (`npm run start:dev`) et récupérer l'IP locale du PC (`ipconfig`).
2. Les participants (même Wi-Fi) ouvrent `http://<ip-du-pc>:3000/live-demo`
   sur leur téléphone et se connectent — comptes de démo seedés :
   `citoyen1@algodemo.local` … `citoyen5` / `pointfocal@algodemo.local`
   (mot de passe `Demo1234!`), ou leur propre compte.
3. L'animateur (admin/point focal) crée un débat (Swagger), le **démarre**,
   puis soumet des affirmations depuis son panneau modérateur sur la page.
   Sa caméra/micro s'activent (autoriser l'accès dans le navigateur).
4. La salle **voit et entend** le direct vidéo, vote ✅/❌ — les jauges bougent
   sur tous les écrans ; les signalements arrivent chez le modérateur.

Prérequis vidéo : `docker compose up -d` (démarre aussi LiveKit) et, pour un
accès depuis d'autres appareils, autoriser Node **et** les ports LiveKit
(7880-7881, 50000-50019/udp) dans le pare-feu.

⚠️ `/live-demo` et les comptes de démo sont des outils de test — à retirer
avant la mise en production (l'app mobile consommera les mêmes API/WebSocket).

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
    ├── referentiel/         # Thématique › Critère › Indicateur (Dev B)
    ├── fiche-pays/          # ValeurIndicateur + consultation par pays + import CSV + synthèses IA (Dev B)
    ├── debats/              # Débats & lives : REST + WebSocket temps réel + page /live-demo (Dev B)
    ├── ia/                  # Service IA partagé (contrat) — stub à remplacer par Claude (Dev B)
    ├── auth/                # JWT, RBAC, 2FA, RGPD (Dev A)
    ├── feed/                # Contenus, historique, événement debat.resume.valide (Dev A)
    ├── consultations/       # Consultations (vote 2FA), avis modérés (Dev A)
    ├── notifications/       # Tokens push, notifications in-app, contrat d'événements notif.* (Dev A)
    └── back-office/         # Dashboard, modération unifiée, journal d'audit global (Dev A)
```

Modules à venir (Dev B) : résumés post-débat (IA + validation → événement
`debat.resume.valide` vers le Feed) et `collecte` (scraping) — le périmètre
Dev A (§4 de la doc de répartition) est complet.
