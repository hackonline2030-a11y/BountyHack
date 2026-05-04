# Bug Bounty App — monorepo

Ce dépôt est un **monorepo** Git : une historique commune (`main`, branches `release/*`, branche de dev, etc.), mais **plusieurs livrables indépendants** en production.

## Contenu du dépôt

- **Frontend** : Next.js dans [`client/`](client/)
- **Backend** : API NestJS (workspace Nx) dans [`server/`](server/)

Documentation détaillée :

- [`client/README.md`](client/README.md)
- [`server/README.md`](server/README.md)
- Docker backend (installation, **`start.sh`**, équivalents `docker compose`, **Windows et WSL2**) : [`server/docker/README.md`](server/docker/README.md)

Si tu développes sous **Windows**, pour lancer l’API avec les scripts bash (depuis **`server/`** : `./docker/start.sh`), privilégie **WSL2 + Docker Desktop** (intégration WSL activée) et suis ce guide : évite les incohérences avec PowerShell pur et les chemins sous **`C:\`** seuls pour le mode watch Docker.

---

## Déploiement en production : client et serveur sont séparés

### Même branche Git ne veut pas dire « un seul paquet en prod »

Sur une branche donnée (`main` ou une `release/*`), le commit est **unique**, mais tu peux (et en général tu dois) :

- **compiler et publier le front** depuis `client/` vers sa cible (ex. Vercel, Cloudflare, hébergement Node + `next start`, autre),
- **compiler et publier l’API** depuis `server/` vers sa cible (ex. VM + Docker, Kubernetes, PaaS avec conteneur),

sans mélanger les deux dans un seul artefact. Chaque pipeline ne prend que le dossier et les fichiers dont il a besoin.

### Pourquoi séparer ?

- **Cycle de vie différent** : redéployer le front sans toucher au back, ou inversement.
- **Mise à l’échelle** : le front est souvent statique / CDN ; l’API consomme CPU, DB, secrets.
- **Sécurité** : secrets backend (JWT, Mongo, Firebase…) restent côté serveur ; le navigateur ne voit que les variables `NEXT_PUBLIC_*` et les appels HTTP vers l’API.

### Rôle de l’API (CORS, URL publique)

Une fois séparés, le front appelle l’API via une **URL HTTPS** dédiée au backend. Sur le serveur, `CORS_ORIGIN` (voir [`server/.env.example`](server/.env.example)) doit lister **l’origine exacte du front** en production (sans path), pour que le navigateur autorise les requêtes cross-origin.

---

## Image Docker et GitHub Container Registry (GHCR) : **uniquement le serveur**

L’image Docker de **production** prévue pour cette API est construite à partir du dossier **`server/`** (voir [`server/docker/Dockerfile`](server/docker/Dockerfile)). Elle embarque le build Nx (`dist/`, assets nécessaires au runtime) et exécute **`node dist/main.js`**.

En pratique pour GHCR :

1. **Contexte de build** : répertoire **`server/`** (le `docker-compose` du backend utilise déjà `context: ..` depuis `server/docker/`, soit la racine **`server/`**). Le Dockerfile attend le `package.json`, le `pnpm-lock.yaml` et les sources de l’API à cet endroit — pas le dossier `client/`.
2. **Exemple depuis la racine du monorepo** :
   ```bash
   docker build -f server/docker/Dockerfile -t ghcr.io/<org>/<image-api>:<tag> server/
   ```
3. **Nom d’image** : par convention `ghcr.io/<org-ou-user>/<nom-image-api>:<tag>` ; le tag peut suivre la version release ou le SHA du commit.
4. **Une image = l’API** : le client Next.js n’a pas à être copié dans cette image ; son déploiement est un flux **à part** (autre workflow, autre registre si tu conteneurises aussi le front plus tard).

Résumé : **le monorepo vit dans un seul repo Git ; le registre GHCR que tu crées pour cette image ne concerne que le binaire / conteneur du backend**, isolé du frontend.

---

## Sécurité et signalement

Voir [`SECURITY.md`](SECURITY.md) (politique de divulgation responsable, branches `main` / `release/*` / dev).
