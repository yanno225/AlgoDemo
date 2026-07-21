# AlgoDémo — Frontend

Plateforme de veille citoyenne anti-désinformation du Laboratoire
Ouest-Méditerranée (Fondation pour l'Innovation Démocratique), en partenariat
avec l'équipe ESATIC — CID.

Ce dépôt contient les **deux interfaces** du projet :

| Dossier | Rôle | Technologie |
|---|---|---|
| [`algodemo/`](./algodemo) | Application mobile citoyenne | Expo SDK 54 · React Native · TypeScript |
| [`algodemo-admin/`](./algodemo-admin) | Back-office d'administration | Next.js 16 · React 19 · Tailwind v4 |

> **État actuel** — le backend n'est pas encore livré. Les deux interfaces
> fonctionnent sur des données simulées. Chaque point de branchement est
> marqué `TODO(backend)` dans le code, avec l'endpoint attendu.

---

## Prérequis

- **Node.js 20.9 ou supérieur** (imposé par Next.js 16)
- **npm** (les deux projets utilisent `package-lock.json`)
- Pour le mobile : l'application **Expo Go** sur un téléphone Android ou iOS,
  ou un émulateur configuré

Vérifier sa version :

```bash
node --version
```

---

## Application mobile

```bash
cd algodemo
npm install
npx expo start
```

Scanner ensuite le QR code affiché avec **Expo Go** (Android) ou l'appareil
photo (iOS). Touches utiles dans le terminal : `a` pour Android, `i` pour iOS,
`r` pour recharger.

### Comptes de démonstration

| Identifiant | Mot de passe |
|---|---|
| `demo@algodemo.ci` | `demo123` |
| `admin@algodemo.ci` | `admin123` |

Le fil d'actualité est également accessible **sans compte** (règle RG-USR-05) :
le lien « Découvrir le fil sans compte » se trouve sous le bouton de connexion.

---

## Back-office d'administration

```bash
cd algodemo-admin
npm install
npm run dev
```

Puis ouvrir <http://localhost:3000>.

### Comptes de démonstration

| Email | Rôle | Accès |
|---|---|---|
| `admin@algodemo.org` | Administrateur Laboratoire | Toutes les sections |
| `focal@algodemo.org` | Point focal | Modération et référentiel uniquement |

Le mot de passe accepte **n'importe quelle valeur d'au moins 4 caractères**, et
le code de vérification **n'importe quels 6 chiffres** — l'authentification
réelle appartient au backend. Les deux comptes sont rappelés sur l'écran de
connexion, et cliquer sur l'un d'eux pré-remplit le champ.

Se connecter en **point focal** permet de constater le filtrage des
permissions : la navigation se réduit à deux entrées.

---

## Vérifier avant de proposer une modification

```bash
# Mobile
cd algodemo && npx tsc --noEmit

# Back-office
cd algodemo-admin && npx tsc --noEmit && npx eslint . && npm run build
```

---

## Conventions

- **Code en anglais**, interface en français. Aucune chaîne visible ne doit
  être écrite en dur : tout passe par la couche i18n
  (`algodemo/i18n/fr.json`). La feuille de route prévoit le dioula, le haoussa,
  le wolof et l'amazigh.
- **Les tokens de design** vivent dans `algodemo/constants/theme.ts` (mobile)
  et `algodemo-admin/app/globals.css` (web). Couleurs, rayons et ombres sont
  communs aux deux produits — toute évolution doit être répercutée des deux
  côtés.
- **Les cinq thématiques** (`Genre et Société`, `Jeunesse et Société`, `Droit`,
  `Politique`, `Société et Vivant`) sont fixes : ne jamais modifier cette liste
  sans accord du comité de pilotage (RG-THE-01).
- **L'accessibilité n'est pas optionnelle** : elle figure explicitement dans la
  note conceptuelle du bailleur. Contrastes, lecture vocale, taille de police
  ajustable et respect de « réduire les animations » sont implémentés et
  doivent le rester.

---

## Dépannage

**Le bundler mobile affiche des erreurs incohérentes**
Vider le cache Metro : `npx expo start --clear`.

**Le back-office renvoie des erreurs 500 après un changement de branche**
Le cache Turbopack peut se corrompre. Serveur arrêté :
`rm -rf .next` puis `npm run dev`.

**`npm install` échoue sur un conflit de dépendances**
Les versions sont alignées sur Expo SDK 54 et Next 16. Ne pas mettre à jour
les paquets un par un : vérifier avec `npx expo install --check` côté mobile.
