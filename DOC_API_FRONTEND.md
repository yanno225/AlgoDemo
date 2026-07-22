# AlgoDémo — Documentation API pour l'application mobile

> **Public** : équipe frontend (app mobile React Native / Flutter).
> **Backend** : NestJS + PostgreSQL + LiveKit (vidéo) + MinIO (fichiers) + socket.io (temps réel).
> **Référence interactive** : Swagger sur `http://<hote>:3000/api/docs` (toutes les routes, schémas et essais en direct).

---

## 1. Démarrer le backend et s'y connecter

```bash
npm install
cp .env.example .env          # puis compléter (voir README)
docker compose up -d           # PostgreSQL + LiveKit (vidéo) + MinIO (fichiers)
npm run migration:run
npm run seed                   # référentiel officiel + admin initial
npm run start:dev              # API sur le port 3000
```

**URL de base selon le contexte :**

| Contexte | URL de base API |
|---|---|
| Émulateur Android sur le PC du backend | `http://10.0.2.2:3000` |
| Simulateur iOS sur le même Mac/PC | `http://localhost:3000` |
| Téléphone réel, même Wi-Fi | `http://<IP-du-PC>:3000` (ex. `http://192.168.1.20:3000`) |

⚠️ Pour un téléphone réel : autoriser Node + les ports dans le pare-feu Windows
(3000, 7880-7882 pour la vidéo, 9000 pour les médias), et mettre l'IP du PC dans
`LIVEKIT_NODE_IP` et `S3_PUBLIC_URL` du `.env` backend.

**Comptes de développement** (seed) : `admin@algodemo.local` / `Admin1234!` (ADMIN).

---

## 2. Conventions générales

- **Authentification** : JWT. Envoyer `Authorization: Bearer <accessToken>` sur toute route protégée.
- **Rôles** : `UTILISATEUR` (citoyen) · `POINT_FOCAL` (journaliste/expert certifié) · `ADMIN` (Laboratoire). Les routes indiquent le rôle minimal ; « Public » = sans token.
- **Access token** : expire en **15 min** → utiliser `POST /auth/refresh` avec le `refreshToken` (7 j) pour renouveler. Prévoir un intercepteur HTTP qui rafraîchit sur 401.
- **Format d'erreur** (uniforme, toutes routes) :
```json
{ "statusCode": 404, "path": "/debats/xxx", "timestamp": "2026-07-22T10:00:00.000Z", "message": "Débat xxx introuvable" }
```
- **Validation** : toute propriété inconnue dans un corps JSON est rejetée (400).
- **Dates** : ISO 8601 (`2026-07-25T18:00:00Z`) ; les dates de mesure sont `AAAA-MM-JJ`.
- **IDs** : UUID partout.

---

## 2 bis. La logique métier du backend (à lire avant de coder les écrans)

### Les 3 rôles et ce qu'ils impliquent à l'écran

- **UTILISATEUR** (citoyen) : lit tout ce qui est public, vote, écrit des avis, participe aux débats (regarde le live, vote ✅/❌, signale). *Il ne publie jamais rien directement.*
- **POINT_FOCAL** (journaliste/expert certifié par le Labo) : + crée des contenus, anime les débats (caméra/micro), modère.
- **ADMIN** (équipe Laboratoire) : + gère tout (référentiel, comptes, validations, collecte).

→ L'app doit adapter ses menus au rôle (présent dans `GET /auth/me` et dans le JWT).

### Le principe central : rien n'est publié sans validation humaine

C'est la règle de conception de toute l'application (anti-désinformation oblige).
Quatre circuits suivent exactement le même schéma **brouillon → validation → publication** :

| Circuit | Qui propose | Qui valide | Où ça finit |
|---|---|---|---|
| **Contenu du feed** | Point focal (crée, non publié) | Point focal/Admin (`/publier`) | `GET /feed` |
| **Avis citoyen** | Utilisateur (`POST /avis`, statut EN_ATTENTE) | Point focal/Admin (modération) | `GET /avis` (approuvés seuls) |
| **Synthèse fiche-pays** & **résumé de débat** | **L'IA rédige un brouillon** (`texteGenereIA`) | Admin/staff (relit, corrige, valide) | Fiche-pays / Feed |
| **Valeur d'indicateur collectée** | Les **sources automatiques** (API) et l'**IA** (textes) créent des *propositions* | Admin (avec triangulation + reformulation IA) | Fiche-pays |

→ Conséquence UI : ce qu'un utilisateur vient de soumettre n'apparaît **pas
immédiatement** en public. Afficher « en attente de modération ».

### Où l'IA intervient (et où elle n'intervient pas)

L'IA (Mistral) **rédige des brouillons** : synthèses de fiche-pays, résumés de
débats (à partir du **verbatim réellement transcrit** + votes — consigne stricte
de ne rien inventer), reformulation des valeurs collectées, extraction de
chiffres depuis des rapports. Elle **ne publie jamais** : un humain valide
toujours. Elle n'intervient pas dans : l'auth, les votes, le feed, le live.

### Le cycle de vie d'un débat (l'enchaînement complet)

```
PLANIFIE  ──/demarrer──▶  EN_COURS  ──/cloturer──▶  TERMINE
(visible                 (le live :                (replay +
 « à venir »)             vidéo LiveKit,            résumé)
                          votes, signalements,
                          transcription)
```
1. **PLANIFIE** : créé par le staff, visible dans « à venir ».
2. **`/demarrer`** → notification push automatique à tous les consentants ; la salle ouvre (socket.io + vidéo).
3. **EN_COURS** : le public rejoint (`rejoindre`), regarde le direct, vote sur les affirmations lancées par le modérateur, signale ; les intervenants alimentent la transcription (sous-titres en direct).
4. **`/cloturer`** : la salle ferme (`debat.cloture` diffusé), le débat passe en TERMINE.
5. Le staff **génère le résumé IA** (basé sur la transcription + votes), le relit, le **valide** → le backend émet un événement interne et le Feed **publie automatiquement** le résumé comme contenu. Le replay (fichier uploadé via `/media/upload`) est rattaché avec `/replay`.

### Le parcours d'une donnée de la fiche-pays (de la source au citoyen)

```
API ouvertes (Banque Mondiale, OMS…)          Rapports/articles
   │ job automatique hebdomadaire                 │ admin colle le texte
   ▼                                              ▼ l'IA extrait les chiffres
            PROPOSITIONS (une par source — rien de public)
                           │
                           ▼
   Écran admin : triangulation (les sources concordent-elles ?)
                + reformulation rédigée par l'IA
                           │  l'admin valide
                           ▼
        VALEUR OFFICIELLE → visible dans GET /fiche-pays/{pays}
                           │  l'admin déclenche/valide la synthèse IA
                           ▼
        SYNTHÈSE rédigée par thématique (champ `synthese`)
```

### Les automatismes entre modules (rien à faire côté front)

- Résumé de débat validé → **publication auto dans le Feed**.
- Débat démarré / résultats publiés / contenu publié / avis modéré → **notification** créée (+ push si Firebase configuré et consentement donné).
- Collecte : tourne **toute seule** chaque semaine (cron backend).
- Sécurité : votes de consultation à **usage unique** (1/personne, 2FA), revote
  possible uniquement sur les affirmations de débat **tant qu'elles sont ouvertes**.

---

## 3. Auth & compte (`/auth`)

### Parcours d'inscription (avec email réel)
```
POST /auth/register            { email, motDePasse, nom, prenom, telephone? }
        → 201 ; un code à 6 chiffres est envoyé PAR EMAIL (SMTP réel)
POST /auth/verify-email        { email, code }
        → l'email est validé
POST /auth/login               { email, motDePasse, codeOtp? }
        → { accessToken, refreshToken } — codeOtp (TOTP) requis seulement si 2FA activée
```
Mot de passe : min. 8 caractères, au moins une lettre et un chiffre.

| Route | Accès | Description |
|---|---|---|
| `POST /auth/register` | Public | Inscription (OTP envoyé par email) |
| `POST /auth/verify-email` | Public | `{ email, code }` |
| `POST /auth/resend-otp` | Public | Renvoyer un code |
| `POST /auth/login` | Public | → `{ accessToken, refreshToken }` (ou `{ deuxFaRequis: true }`) |
| `POST /auth/refresh` | Public | `{ refreshToken }` → nouveaux tokens |
| `POST /auth/logout` | Authentifié | Révoque le refresh token |
| `GET /auth/me` | Authentifié | Profil courant (id, email, nom, prénom, rôle…) |
| `POST /auth/2fa/enable` → `/confirm` → `/disable` | Authentifié | Activer TOTP (obligatoire pour voter aux consultations) |
| `PATCH /auth/consent` | Authentifié | RGPD : consentement notifications / politique |
| `POST /auth/anonymisation` | Authentifié | RGPD : anonymisation irréversible |
| `GET /auth/users` · `PATCH /auth/users/:id/valider` · `/bloquer` · `/role` | ADMIN | Gestion des comptes |

---

## 4. Feed (`/feed`) — écran d'accueil

Contenus éducatifs vérifiés (vidéos, fiches, articles), rattachés à une thématique.

| Route | Accès | Description |
|---|---|---|
| `GET /feed` | Public | **Paginé**. Filtres : `page`, `limit`, `thematiqueId`, `type` (`VIDEO`\|`FICHE`\|`ARTICLE`), `statutVerification` (`NON_VERIFIE`\|`PARTIELLEMENT_VERIFIE`\|`VERIFIE`), `telechargeable`, `dateDebut`, `dateFin`, `q` (mot-clé), `tri` (`date`\|`pertinence`) |
| `GET /feed/offline` | Public | Package hors-ligne (contenus `telechargeable`) — à mettre en cache local |
| `GET /feed/historique` | Authentifié | Historique de lecture |
| `GET /feed/:id` | Public | Détail (corps, `urlMedia`, `urlAudio`, source, `estOfficiel`…) |
| `POST /feed/:id/lu` | Authentifié | Marquer lu |
| `POST /feed/:id/signaler` | Authentifié | Signaler un contenu `{ motif }` |
| `POST /feed` · `PATCH /feed/:id` · `/publier` · `/depublier` · `POST /feed/:id/audio` · `DELETE` | POINT_FOCAL/ADMIN | Création/gestion (corps : `titre`, `corps`, `type`, `thematiqueId`, `statutVerification?`, `estOfficiel?`, `source?`, `urlMedia?`, `telechargeable?`) |
| `GET /feed/signalements` · `PATCH /feed/signalements/:id/traiter` | POINT_FOCAL/ADMIN | Modération |

**Vidéos/images** : uploader d'abord via `POST /media/upload` (voir §11), puis mettre l'URL retournée dans `urlMedia`.

**🔊 Lecture audio (accessibilité malvoyants, CDC §7.1)** : à faire avec le **TTS natif du téléphone** (`expo-speech`, `react-native-tts`, `flutter_tts`) en lisant `titre` + `corps` du contenu — gratuit, hors-ligne, dans la langue du système. Pas d'appel backend nécessaire.

---

## 5. Consultations & avis (`/consultations`, `/avis`)

| Route | Accès | Description |
|---|---|---|
| `GET /consultations?statut=ouvertes\|cloturees\|toutes` | Public | Liste |
| `GET /consultations/:id` | Public | Détail + options de vote `{ id, libelle }` |
| `POST /consultations/:id/vote` | Authentifié | `{ optionId, codeOtp }` — **2FA obligatoire** : 403 si 2FA non activée sur le compte, 409 si déjà voté |
| `GET /consultations/:id/resultats` | Public | Agrégats — 404 tant que non publiés |
| `GET /avis?thematiqueId=` | Public | Avis **approuvés** |
| `POST /avis` | Authentifié | `{ texte, thematiqueId }` → passe en modération |
| CRUD consultations, publication résultats, modération avis | POINT_FOCAL/ADMIN | Voir Swagger |

**Parcours UX à prévoir** : pour voter, l'utilisateur doit d'abord activer la 2FA (écran dédié : `POST /auth/2fa/enable` → afficher le QR/secret → `confirm` avec le code de l'app d'authentification).

---

## 6. Référentiel (`/thematiques`, `/criteres`, `/indicateurs`)

La grille officielle : **5 thématiques → 23 critères → 86 indicateurs** (seedés).

| Route | Accès | Description |
|---|---|---|
| `GET /thematiques/arbre` | Public | **LA route pour les filtres** : hiérarchie complète thématiques → critères → indicateurs |
| `GET /thematiques` · `/criteres` · `/indicateurs` (+`/:id`) | Public | Listes/détails |
| POST/PATCH/DELETE | ADMIN | Gestion |

À charger au démarrage de l'app et mettre en cache (IDs stables).

---

## 7. Fiche-pays (`/fiche-pays`)

**`GET /fiche-pays/Côte d'Ivoire`** (URL-encoder le nom ; insensible à la casse) →

```json
{
  "pays": "Côte d'Ivoire",
  "nombreValeurs": 14,
  "thematiques": [{
    "id": "…", "libelle": "Genre et Société",
    "synthese": { "texte": "…rédigée par IA, validée par l'admin…", "dateValidation": "…" },
    "criteres": [{
      "id": "…", "libelle": "Violences basées sur le genre",
      "indicateurs": [{
        "id": "…", "libelle": "Nombre de cas de VBG signalés",
        "valeurs": [ { "valeur": 4210, "dateMesure": "2024-01-01", "source": "…" } ]
      }]
    }]
  }]
}
```
- `valeurs` triées de la plus récente à la plus ancienne → **graphiques d'évolution**.
- `synthese` est `null` tant qu'aucune synthèse n'est validée. Lecture audio : TTS natif sur `synthese.texte`.
- Admin : CRUD `/valeurs-indicateurs`, import CSV, génération/validation des synthèses (`/syntheses`) — voir Swagger.

---

## 8. Débats & lives (`/debats` + WebSocket + vidéo)

### 8.1 REST

| Route | Accès | Description |
|---|---|---|
| `GET /debats?filtre=a-venir\|en-cours\|termines` | Public | Listes (avec `thematique`) |
| `GET /debats/:id` | Public | Détail + affirmations + `urlReplay` |
| `GET /debats/:id/live-token` | Authentifié | **Accès vidéo** → `{ url, token, room, peutPublier }` (voir 8.3) |
| `POST /debats` · `PATCH /debats/:id` · `/demarrer` · `/cloturer` · `/replay` · `DELETE` | POINT_FOCAL/ADMIN | Cycle de vie (`{ titre, description?, thematiqueId, dateDebut, moderateurId? }`) |
| `POST /debats/:id/affirmations` · `PATCH /debats/affirmations/:id/fermer` | POINT_FOCAL/ADMIN | Affirmations au vote |
| `GET /debats/:id/signalements` · `PATCH /debats/signalements/:id/traiter` | POINT_FOCAL/ADMIN | Modération |
| `POST /debats/:id/resume/generer` · `GET /debats/resumes/liste` · `PATCH /debats/resumes/:id/valider` · `/rejeter` | POINT_FOCAL/ADMIN | Résumé IA post-débat → validation → **publication auto dans le Feed** |

### 8.2 Salle temps réel (socket.io, namespace `/debats`)

Client : `socket.io-client`.
```js
const socket = io(`${BASE_URL}/debats`, { auth: { token: accessToken } });
```

**Client → serveur** (tous avec accusé de réception en callback `{ ok, message? }`) :

| Événement | Payload | Effet |
|---|---|---|
| `rejoindre` | `{ debatId }` | Rejoint la salle → réponse : `{ ok, debat, roleParticipation, affirmations[] }` (état courant avec décomptes) |
| `voter` | `{ affirmationId, valide: boolean }` | Vote ✅/❌ (revoter remplace) |
| `signaler` | `{ debatId, message }` | Signale une fausse info au staff |
| `transcription` | `{ debatId, texte }` | **Intervenants seulement** : envoie une phrase transcrite (voir 8.4) |

**Serveur → client** (s'abonner après `rejoindre`) :

| Événement | Payload | UI à mettre à jour |
|---|---|---|
| `participants.maj` | `{ nombre }` | Compteur de participants |
| `affirmation.nouvelle` | `{ id, texte }` | Nouvelle carte de vote |
| `vote.maj` | `{ affirmationId, valides, invalides }` | Jauges en direct |
| `affirmation.fermee` | `{ affirmationId, valides, invalides }` | Vote clos, décompte final |
| `transcription.maj` | `{ intervenant, texte }` | Sous-titres en direct |
| `signalement.nouveau` | `{ id, message, de, recuLe }` | (staff uniquement) file de signalements |
| `debat.demarre` / `debat.cloture` | `{ debatId, titre? }` | Bandeau live / fin |

### 8.3 Vidéo en direct (LiveKit)

1. `GET /debats/:id/live-token` → `{ url, token, room, peutPublier }`.
2. SDK client LiveKit (`livekit-client` web, `@livekit/react-native`, `livekit_client` Flutter) :
   `room.connect(url, token)`.
3. `peutPublier: true` (modérateur/intervenant) → activer caméra+micro ; `false` (public) → lecture seule (le serveur REFUSE la publication de toute façon).
4. Afficher les pistes reçues (`TrackSubscribed`). Se déconnecter sur `debat.cloture`.

### 8.4 Transcription (verbatim du débat)

Côté **intervenants uniquement** : utiliser la reconnaissance vocale native
(`@react-native-voice/voice`, `speech_to_text` Flutter, langue `fr-FR`) et envoyer
chaque phrase finale via l'événement `transcription`. Le backend stocke le
verbatim (base factuelle du résumé IA) et le rediffuse à toute la salle
(`transcription.maj` → sous-titres). Les spectateurs n'envoient rien.

---

## 9. Notifications (`/notifications`)

| Route | Accès | Description |
|---|---|---|
| `POST /notifications/devices` | Authentifié | Enregistrer le **token FCM** de l'appareil `{ token, plateforme }` |
| `DELETE /notifications/devices/:token` | Authentifié | Désenregistrer (logout) |
| `GET /notifications` | Authentifié | Liste in-app (cloche 🔔) |
| `PATCH /notifications/lues` · `/:id/lue` | Authentifié | Marquer lu |

**Côté mobile** : intégrer le SDK Firebase Messaging, demander la permission,
récupérer le token FCM et l'envoyer à `POST /notifications/devices` après le login.
Respect du consentement : le backend n'envoie qu'aux comptes ayant accepté
(`PATCH /auth/consent`). Déclencheurs automatiques : débat qui démarre, résultats
publiés, contenu publié, avis modéré.

---

## 10. Back-office (`/back-office`) — ADMIN

`GET /back-office/dashboard` (stats), `GET /back-office/moderation` (file unifiée
avis+contenus+signalements), `GET /back-office/audit` (journal). Pour l'interface
d'administration (peut être une web app plutôt que mobile).

## 11. Médias (`/media`)

| Route | Accès | Description |
|---|---|---|
| `POST /media/upload` | POINT_FOCAL/ADMIN | multipart, champ **`fichier`** (image/vidéo MP4-WebM/audio/PDF, max 200 Mo) → `{ url, cle, type, taille }` |

Mettre l'`url` retournée dans `urlMedia` (contenu) ou `urlReplay` (débat).
Les fichiers sont servis publiquement à cette URL (streaming direct dans l'app).

## 12. Collecte / veille (`/collecte`) — ADMIN

Collecte automatique continue (job hebdomadaire) depuis des API ouvertes
(Banque Mondiale, OMS) + ingestion de texte par IA. Écrans d'admin possibles :
`GET /collecte/triangulation` (croisement des sources), `GET /collecte/indicateur/:id/analyse`
(toutes les valeurs + reformulation IA), `PATCH /collecte/propositions/:id/valider`/`rejeter`.

---

## 13. Récapitulatif des écrans mobiles ↔ API

| Écran app | Endpoints principaux |
|---|---|
| Inscription / connexion | `/auth/register`, `/auth/verify-email`, `/auth/login`, `/auth/refresh` |
| Accueil (feed) | `GET /feed`, `GET /thematiques/arbre` (filtres), TTS natif |
| Détail contenu | `GET /feed/:id`, `POST /feed/:id/lu`, `/signaler` |
| Hors-ligne | `GET /feed/offline` (cache local) |
| Consultations | `GET /consultations`, `POST /consultations/:id/vote` (2FA), `GET .../resultats` |
| Avis citoyens | `GET/POST /avis` |
| Fiche-pays | `GET /fiche-pays/{pays}` (+ graphiques d'évolution, TTS sur les synthèses) |
| Débats (liste/détail) | `GET /debats`, `GET /debats/:id` |
| Débat LIVE | `GET /debats/:id/live-token` + LiveKit + socket.io `/debats` |
| Notifications | `GET /notifications`, `POST /notifications/devices` (FCM) |
| Profil / RGPD | `GET /auth/me`, `PATCH /auth/consent`, `/auth/2fa/*`, `/auth/anonymisation` |

---

*Document généré à partir du code — la référence exhaustive (schémas exacts,
codes d'erreur, essais) reste Swagger : `/api/docs`.*
