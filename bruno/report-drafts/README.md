# Bruno — report-drafts

Collection pour lire le JSON des brouillons et soumissions (contenu des **aperçus** dans l’app).

## Ouvrir dans Bruno

1. **Open Collection** → dossier `bugbountyapp/bruno/report-drafts`
2. Choisir l’environnement **local** ou **production**
3. Renseigner `email` / `password` (prod) si besoin
4. Exécuter dans l’ordre :
   - **Login** → remplit `token` et `hunterId`
   - **List report drafts** → remplit `draftId`
   - **Get report draft by id** → JSON complet du brouillon
   - **List submissions for draft** → remplit `submissionId`
   - **Get submission by id** → `payload` de la soumission

## Où est le JSON des aperçus ?

| Aperçu UI | Source API |
|-----------|------------|
| Hunter — étape / cumulatif | `GET /api/report-drafts/draft/:draftId` → `meta.payload`, `collection.payload`, … |
| QC — étape soumise | `GET /api/report-drafts/submissions/:id` → `payload` + `step` |
| QC — cumulatif | draft (étapes `approved`) + submission courante pour l’étape en revue |

Auth : en-tête `Authorization: Bearer <token>` (JWT après login).

## Routes DEV (sans auth)

Dossier `dev/` — uniquement si l’API tourne avec `NODE_ENV=development` (désactivé en production).

Pas besoin de **Login** : renseigner `draftId` / `hunterId` dans l’environnement local, puis exécuter les requêtes `[DEV] …`.

- `GET /api/dev/report-drafts/draft/:draftId` — même corps que la route protégée
- `GET /api/dev/report-drafts/draft/:draftId/inspect` — bundle draft + submissions + commentaires

Voir `server/src/report-draft/dev/README.md`.
