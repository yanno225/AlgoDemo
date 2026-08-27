# Changements backend apportés sur la branche `vrai-frontend`

> Journal à destination de l'équipe backend. Tout ce qui suit a été développé
> pendant le branchement du mobile (Expo) et du back-office (Next.js) sur
> l'API, quand une capacité manquait côté serveur. Les conventions du projet
> ont été respectées : migrations explicites (jamais de `synchronize`),
> nommage en français, modules découplés par IDs (pas de relation TypeORM
> inter-modules — les lectures croisées passent par du SQL direct via
> `DataSource`).
>
> Dernière mise à jour : 17 août 2026.

## Vue d'ensemble des migrations ajoutées

Toutes dans `src/database/migrations/`, à exécuter avec `npm run migration:run` :

| Timestamp | Nom | Objet |
|---|---|---|
| 1754100000000 | AjouterCitationsPropositions | `extrait` + `urlSource` sur `propositions_valeur` |
| 1754200000000 | CreateSourcesAutorisees | Liste blanche des sources de collecte |
| 1754300000000 | CreateHistoriqueRoles | Journal append-only des décisions administratives |
| 1754400000000 | SecretDuVote | **Irréversible** — scinde `votes` en émargement + urne |
| 1754500000000 | CreateInteractionsFeed | « J'aime » + commentaires du feed |
| 1754600000000 | AjouterCouvertureDebats | `urlCouverture` sur `debats` |
| 1754700000000 | CreerMessagesDebat | Fil de discussion des lives |
| 1754800000000 | CreerSignalementsCitoyens | Signalements de terrain (module `participation`) |
| 1754900000000 | AjouterTypeConsultation | `type` CONSULTATION/SONDAGE sur `consultations` |
| 1755000000000 | EnrichirCommentairesFeed | Réponses (`parent_id`) + « j'aime » sur les commentaires |

## Module IA (`src/modules/ia/`)

- **`AnthropicIaService`** ajouté (`@anthropic-ai/sdk`, modèle par défaut
  `claude-opus-5`, surchargable par `ANTHROPIC_MODEL`). Prioritaire dans la
  factory `IA_SERVICE` dès que `ANTHROPIC_API_KEY` est définie ; sinon Mistral
  si sa clé existe ; sinon le stub. Sorties structurées JSON Schema
  (`output_config.format`), gestion du `stop_reason: refusal`.
- Le **stub** est devenu un vrai mode simulation : extraction lexicale
  hors-ligne qui produit des citations réelles du texte ingéré (plus de données
  inventées).
- Coût constaté : ~5-7 ¢ par ingestion (~90 indicateurs dans le prompt).

## Module Collecte (`src/modules/collecte/`)

- **Liste blanche `sources_autorisees`** : CRUD ADMIN sous `/collecte/sources`,
  seed `npm run seed:sources`. Toute ingestion dont la source n'est pas dans la
  liste (active) est refusée.
- **Citations** : chaque proposition de valeur porte `extrait` (verbatim du
  document source) et `urlSource` — exigence du jury « sources cliquables ».
- **Correctif** : `triangulation()` ne triait pas par `dateMesure` alors que la
  sélection « valeur la plus récente par source » suppose ce tri.

## Module Auth (`src/modules/auth/`)

- **OTP à chaque connexion** : un login sans TOTP actif suit désormais
  login → `{otpRequis:true}` + code envoyé par email (en dev : journalisé
  `[MODE DEV — email non envoyé]`) → login avec `codeOtp` (usage unique).
  La branche TOTP (`deuxFaRequis`) reste prioritaire si activée.
- **`historique_roles`** : journal append-only (sans FK vers `users`, pour
  survivre à une suppression de compte) — chaque valider/bloquer/changement de
  rôle écrit qui, quand, ancien → nouveau rôle. `audit_logs` ne suffisait pas
  (le corps des requêtes n'y est pas journalisé).
- **`UserStatsService`** : `GET /auth/users/:id/statistiques` (compteurs réels
  d'activité, SQL direct multi-modules) et `GET /auth/users/:id/historique`.
- `anonymise` exposé dans `UserProfileDto` (RG-USR-07).
- Seed `admin.seed.ts` (`npm run seed`) : compte admin de développement
  `admin@algodemo.local` / `Admin1234!` — à supprimer/écraser en production.

## Module Consultations — SECRET DU VOTE

- La table `votes` (qui reliait `user_id` au choix) est **supprimée**, scindée
  en :
  - `participations_consultation` — l'émargement : qui a voté (unicité), sans
    le choix ;
  - `bulletins` — l'urne : le choix seul, **aucun** `user_id`, datés au jour
    près, réinsérés en ordre aléatoire à la migration.
- Vote = écriture des deux tables dans UNE transaction ; la réponse ne renvoie
  aucun identifiant de bulletin. Nouvel endpoint `GET /consultations/:id/a-vote`
  → `{aVote}`.
- ⚠️ La migration `SecretDuVote` est **volontairement irréversible** (`down()`
  lève une erreur) : re-relier un bulletin à un votant est précisément ce que
  la structure interdit.
- Limite résiduelle assumée : un accès direct au SGBD pourrait corréler via
  `xmin` — hors modèle de menace applicatif.

## Module Consultations — sondages

- **`type`** (`CONSULTATION` | `SONDAGE`, défaut CONSULTATION) sur
  `consultations` : un sondage est une question rapide portée par le MÊME
  moteur (émargement + urne, vote secret, publication des résultats) — le
  champ évite de dupliquer la machinerie dans un second module. Filtre
  `GET /consultations?type=…` (sans filtre : rétro-compatible, tout
  confondu) ; `CreateConsultationDto.type` facultatif. Côté mobile, chaque
  type a son onglet ; côté back-office, un badge « Sondage » distingue les
  cartes.

## Module Feed (`src/modules/feed/`)

- **`reactions_contenu`** (« j'aime », bascule, unique par personne/contenu) et
  **`commentaires_contenu`** (publication immédiate, modération a posteriori).
- Routes : `POST /feed/:id/aimer`, `GET|POST /feed/:id/commentaires`,
  `GET /feed/reactions/miennes`, `DELETE /feed/commentaires/:id`
  (gestionnaires), compteurs via `loadRelationCountAndMap` dans `GET /feed`.
- **`GET /feed/moderation`** (gestionnaires) : contenus non vérifiés OU non
  publiés — invisibles du `GET /feed` public qui filtre `estPublie`.
- **Noms d'auteurs jamais stockés** : résolus à chaque lecture depuis `users`
  au format « Prénom N. », « Citoyen » si le compte est anonymisé — c'est ce
  qui rend l'anonymisation RG-USR-07 rétroactive.
- **Conversations riches** (retours mi-parcours) : `parent_id` sur
  `commentaires_contenu` (fil à UN niveau — répondre à une réponse rattache au
  commentaire racine, cascade à la suppression du parent) + table
  `reactions_commentaire` (« j'aime » bascule, unique par personne). Routes :
  `POST /feed/:id/commentaires` accepte `parentId`,
  `POST /feed/commentaires/:id/aimer` (bascule → `{aime, total}`),
  `GET /feed/:id/commentaires/reactions-miennes` (peindre les cœurs) ; la
  liste publique renvoie désormais `parentId` et `nbAimes`.

## Module Débats (`src/modules/debats/`)

- **`urlCouverture`** sur `debats` (+ DTOs create/update, service) : l'image de
  couverture, uploadée sur MinIO par l'admin, est ce qui distingue visuellement
  des directs simultanés côté mobile. Plusieurs débats `EN_COURS` au même
  moment sont un cas nominal.
- **Fil de discussion du live** (`messages_debat` + gateway `/debats`) :
  - Nouveaux événements CLIENT → SERVEUR : `message { debatId, texte }` et
    `message.supprimer { messageId }` (staff uniquement — revérifié serveur).
  - Nouvelles diffusions : `message.nouveau { id, auteur, certifie, texte,
    creeLe }` et `message.supprime { messageId }` (salle `debat:{id}`).
  - L'accusé `rejoindre` renvoie désormais aussi `messages` (les 50 derniers
    visibles, ordre chronologique).
  - La modération **masque** (`supprimeLe`/`supprimePar`) au lieu d'effacer :
    traçabilité conservée, mais le contenu ne quitte plus jamais le serveur.
  - Même règle de confidentialité que le feed : l'id du compte auteur ne sort
    pas du serveur ; `auteur` est résolu à la lecture (« Prénom N. » /
    « Citoyen »), `certifie` = rôle POINT_FOCAL/ADMIN lu à l'instant T.
  - `LiveService` : `envoyerMessage`, `listerMessages`, `supprimerMessage`,
    helper privé `profilsPublics` (SQL direct sur `users`).

## Module IA — Assistant citoyen de vérification des faits (NOUVEAU)

- L'interface `IaService` (contrat n°4) gagne **`verifierAffirmation`** :
  confronte une affirmation citoyenne aux données mesurées, verdict
  `COHERENT` / `CONTREDIT` / `NON_VERIFIABLE` + explication + éléments cités.
  Implémentée dans les trois fournisseurs (Anthropic, Mistral, stub).
- **Anti-hallucination structurel** : les données sont numérotées et le modèle
  ne renvoie que des INDEX — impossible de citer une source qui n'existe pas ;
  les index invalides sont filtrés côté serveur.
- **`POST /assistant/verifier`** (tout compte authentifié — coût IA réel par
  appel) : `AssistantService` fournit comme contexte TOUT l'historique des
  `valeurs_indicateurs` (l'historique est indispensable pour juger une
  affirmation de tendance) avec sources et arborescence du référentiel.
- Vérifié en réel : tendance confirmée en citant la série 2022→2024, seuil
  faux contredit chiffre à l'appui, hors-périmètre → « non vérifiable » ; le
  modèle signale de lui-même les sources « données de démonstration ».
- **Renforcé (19 août)** : l'assistant mène désormais une **recherche web EN
  DIRECT restreinte aux domaines de la liste blanche des sources** (allowed_domains
  de l'outil web_search — il ne peut physiquement pas consulter un autre site),
  en deux phases : recherche (compte-rendu avec URLs réelles) puis verdict
  structuré ; seules les URLs présentes dans le compte-rendu ET appartenant à
  un domaine autorisé sont renvoyées (`sourcesWeb`). Un **garde de périmètre**
  décline poliment les sujets hors champ (sport, célébrités…) sans dépenser de
  recherche : la plateforme couvre démocratie/gouvernance/droits/vie publique.
  La liste blanche a été peuplée depuis le document d'atelier ESATIC/FID
  (55 sources : CEI, ANSTAT, portails gouv.ci, UNESCO, OMS, Banque mondiale…).
- **Élargi ensuite** : le contexte inclut désormais les `references` —
  synthèses PUBLIEES des fiches pays et contenus VERIFIE/publiés du feed
  (SQL direct, listes numérotées [R…], mêmes index anti-hallucination) —
  la base de vérification grandit donc avec chaque publication de l'équipe.
  Et le résultat porte un `eclairage` facultatif : 2-3 phrases de contexte
  général issues des connaissances du modèle, JAMAIS comptées dans le
  verdict et affichées côté app « non vérifié par nos sources ».

## Module IA — analyse de fichiers citoyens (NOUVEAU)

- **`POST /assistant/verifier-fichier`** (multipart, tout compte
  authentifié) : champ `fichier` (image JPEG/PNG/WebP/GIF ou PDF, 10 Mo
  max) + `question` facultative. Deux temps : (1) l'IA multimodale LIT le
  fichier et en extrait fidèlement 1-3 affirmations factuelles (méthode
  optionnelle `extraireAffirmationsFichier` de l'interface IaService —
  Anthropic seulement, 503 sinon) ; (2) ce texte repart dans le circuit
  standard `verifier` (données plateforme + recherche liste blanche).
  La réponse ajoute `affirmationAnalysee` : le citoyen voit exactement ce
  qui a été soumis au verdict. Aucun stockage du fichier — analyse à la
  volée. ⚠️ Prévoir des timeouts clients LONGS : la vérification complète
  (recherche web comprise) prend 20 à 90 s — le mobile est passé à 180 s
  (texte) et 240 s (fichier).

## Auth — droits RGPD self-service (NOUVEAU)

- **`GET /auth/users/moi/historique`** (tout compte authentifié) : les 100
  derniers événements du compte, UNION chronologique de 9 surfaces (avis,
  émargements de consultations — jamais les choix, débats rejoints, votes
  d'affirmations, messages, commentaires, signalements terrain/contenus,
  prises de parole ACCORDEE/TERMINEE). `{ type, libelle, date }`.
- **`GET /auth/users/moi/donnees`** (tout compte authentifié) : export de
  portabilité (RGPD art. 20) — profil (sans hash/OTP/2FA), toutes les
  contributions en clair, note explicite sur le secret du vote (les
  bulletins sont anonymes par construction et absents de l'export), plus
  les statistiques. Implémentés dans `UserStatsService` (SQL direct,
  modules découplés).

## Auth — statistiques self-service

- **`GET /auth/users/moi/statistiques`** (tout compte) : les compteurs réels
  d'activité de l'utilisateur courant — ce que le profil mobile affiche
  désormais (les pourcentages décoratifs 82/65/48 % de la maquette ont été
  remplacés). Route déclarée avant les routes `:id/…` (sinon « moi » serait lu
  comme un UUID).

## Module Participation (`src/modules/participation/`) — NOUVEAU

- **Signalements citoyens de terrain** (CDC §6.1) : table
  `signalements_citoyens` — catégorie fermée (VOIRIE, ÉCLAIRAGE, DÉCHETS, EAU,
  SÉCURITÉ, DÉSINFORMATION, AUTRE), description, adresse lisible, position GPS
  facultative, photo MinIO facultative, cycle RECU → EN_COURS → RESOLU/REJETE
  tracé (`traiteParUserId`/`traiteLe`).
- Routes `/participation/signalements` : POST (tout compte), GET `recents`
  (public et **anonyme** — l'`auteurId` ne sort jamais), GET `miens` (le
  citoyen suit ses dossiers), GET (file gestionnaires, filtre `?statut`),
  PATCH `:id/statut` (gestionnaires).
- Distinct des signalements de direct (Débats) et des signalements de contenus
  (Feed) : ici on signale le monde réel, pas la plateforme.

## Module Débats — annulation et suppression d'un débat planifié (NOUVEAU)

- **Migration 1755200000000-AjouterStatutAnnule** :
  valeur `ANNULE` ajoutée à l'enum `debats_statut_enum` (via
  COMMIT/ALTER TYPE/BEGIN — un ADD VALUE ne s'exécute pas en transaction).
- **`PATCH /debats/:id/annuler`** (POINT_FOCAL/ADMIN) : PLANIFIE → ANNULE.
  Le débat reste en base (traçabilité) mais l'app mobile le filtre de tous
  ses écrans. `DELETE /debats/:id` refuse désormais un débat EN_COURS
  (un direct se clôture, il ne se supprime pas) — cascade sinon.
- Console admin : boutons Annuler/Supprimer (avec confirmation) sur les
  débats à venir, section « Annulés » avec suppression définitive.

## Module Débats — Prise de parole des citoyens (« main levée », NOUVEAU)

- **Migration 1755100000000-CreerDemandesParole** : table `demandes_parole`
  (id, debatId FK CASCADE, userId, statut, decidePar, creeLe, majLe) +
  index partiel UNIQUE garantissant une seule demande vivante
  (EN_ATTENTE/ACCORDEE) par citoyen et par débat.
- **`ParoleService`** (`services/parole.service.ts`) : cycle
  EN_ATTENTE → ACCORDEE → TERMINEE (sorties REFUSEE/ANNULEE), tribune
  limitée à `MAX_TRIBUNE = 2`, staff = modérateur désigné ou
  ADMIN/POINT_FOCAL (même règle que `rejoindre`), noms publics « Prénom N. »
  résolus à la lecture (RG-USR-07 rétroactif), tout est conservé et
  horodaté (journal d'audit d'un événement public).
- **Gateway `/debats`** — nouveaux événements client :
  `parole.demander` / `parole.annuler` / `parole.redescendre` (citoyen),
  `parole.accorder` / `parole.refuser` / `parole.retirer` (staff, par
  demandeId). Diffusions : `parole.file` (salle staff), `tribune.maj`
  (toute la salle), `parole.statut` (au seul citoyen concerné). L'accusé de
  `rejoindre` embarque `parole: { maDemande, tribune, file? }` (file
  réservée au staff). La clôture du débat vide file et tribune.
- Phase 2 prévue (build de développement LiveKit) : à l'accord, régénérer
  un jeton `canPublish` audio pour le citoyen et le révoquer au retrait —
  la mécanique ci-dessus ne changera pas.

## Média / MinIO

- **`POST /media/upload` ouvert à tous les comptes authentifiés** (était
  POINT_FOCAL/ADMIN) : la photo d'un signalement citoyen part du téléphone.
- Variables `S3_*` du `.env` remplies pour le conteneur `algodemo_minio` du
  docker-compose de l'équipe (le backend NestJS tourne sur l'hôte).
- **Streaming par l'API — `GET /media/f/:annee/:mois/:fichier` (public,
  Range accepté)** : le backend streame lui-même les objets du bucket
  (statObject + getObject/getPartialObject, réponses 200/206/404,
  `Cache-Control: immutable`). `uploader()` renvoie désormais une URL
  **RELATIVE** `/media/f/<clé>` que les clients préfixent par l'adresse de
  l'API. Motivation (vécue en démo) : les URLs MinIO absolues stockées en
  base figeaient l'IP LAN du poste — sur un autre réseau, plus aucun média ne
  se chargeait. `S3_PUBLIC_URL` n'est plus utilisée. Les URLs absolues déjà
  en base ont été réécrites en relatif :
  `regexp_replace(col, '^https?://[^/]+/algodemo-media/', '/media/f/')` sur
  `contenus.url_media`, `contenus.url_audio`, `debats."urlCouverture"`,
  `debats."urlReplay"`, `signalements_citoyens."urlPhoto"`.
- ⚠️ Démo nomade : ouvrir le port 3000 dans le pare-feu Windows sur **tous
  les profils** (les réseaux inconnus sont classés « publics ») :
  `New-NetFirewallRule -DisplayName "AlgoDemo API 3000" -Direction Inbound
  -Protocol TCP -LocalPort 3000 -Action Allow -Profile Any` (PowerShell
  administrateur). Et vérifier que Docker Desktop tourne — une mise en
  veille du portable peut l'arrêter (symptôme : 500 `ECONNREFUSED`).

## Points d'attention restants (non traités, côté équipe backend)

1. **`articles_indicateur`** : `getIndicateurDetail` (module fiche-pays) sert
   des articles sans validation humaine tracée (qui/quand) — à aligner sur le
   circuit de validation des autres contenus.
2. **Synthèses IA de la fiche pays** : le service ne retrouve pas les
   `valeurs_indicateurs` existantes (Claude répond honnêtement « aucune donnée
   mesurée ») — la requête de collecte des valeurs est à revoir.
3. **Notifications** : `notif.debat.demarre` est émis au démarrage d'un live ;
   le push effectif aux consentants reste à brancher (SMTP/FCM réels).
4. **19 pays** : aucune entité `Pays` — `paysOuZone` est une chaîne libre.
5. **SMTP réel** pour les OTP (aujourd'hui journalisés en dev). Le compte
   Gmail officiel du projet est inaccessible — le `.env` local est pré-rempli
   avec l'adresse de secours fournie par l'équipe
   (`yannickdominique77@gmail.com`) ; il ne manque que le mot de passe
   d'application Google et `SMTP_HOST=smtp.gmail.com` pour activer.
   Côté mobile, les rappels de débats sont des notifications locales
   programmées (Expo Go ne supporte pas le push distant) ; l'infrastructure
   push FCM du backend (`POST /notifications/devices` + `PushService`) sera
   branchée au passage en build de développement.
6. La clé `ANTHROPIC_API_KEY` de développement devra être **révoquée et
   régénérée** après l'événement d'octobre.
