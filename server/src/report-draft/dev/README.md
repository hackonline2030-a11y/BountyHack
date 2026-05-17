# Report-draft — routes DEV (à supprimer avant prod)

Contrôleurs **sans authentification**, chargés uniquement si `NODE_ENV !== production`.

Préfixe HTTP : `{GLOBAL_PREFIX}/dev/report-drafts` (ex. `http://localhost:3000/api/dev/report-drafts`).

| Méthode | Chemin | Équivalent protégé |
|--------|--------|-------------------|
| GET | `?hunterId=` | `GET /report-drafts?hunterId=` |
| GET | `/draft/:draftId` | `GET /report-drafts/draft/:draftId` |
| GET | `/draft/:draftId/inspect` | Bundle draft + submissions + commentaires |
| GET | `/submissions?draftId=` | `GET /report-drafts/submissions?draftId=` |
| GET | `/submissions/:submissionId` | `GET /report-drafts/submissions/:id` |
| GET | `/comments?submissionId=` | `GET /report-drafts/comments?submissionId=` |
| GET | `/comments?submissionId=&forStep=true` | idem avec `forStep` |
| GET | `/draft/:draftId/steps/:step/comments` | commentaires par étape (0–7) |

Swagger : tag **dev-report-drafts (local only)** sur `/api/docs`.

Bruno : `bugbountyapp/bruno/report-drafts/dev/`.
