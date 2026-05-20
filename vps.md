# VPS — notes d’exploitation

> **Versionné dans le dépôt GitHub (repo privé).** Pas de secrets en clair (`<mot-de-passe>` uniquement).
>
> **Lecture prévue : terminal SSH sur le VPS** (`less ~/bugbountyapp/vps.md`). Ce fichier **n’est pas servi sur Internet** : nginx ne proxy que vers Next (3001) et l’API Nest (3000) ; ne pas ajouter de `location` / `alias` vers le dépôt, ni placer ce fichier sous `client/public/`.

Hébergement **LWS** (ex. `vps120538`, IP publique dans le panneau client).

## Pare-feu

Le **pare-feu du VPS est géré dans le panneau LWS**, pas via une config applicative du dépôt. Sur l’image Debian fournie, **UFW n’est en général pas installé** : les règles effectives passent par l’interface hébergeur.

**Où configurer :** espace client LWS → VPS → **Administration avancée** → **Pare-feu** (ou équivalent).

### Ports à autoriser depuis Internet

| Port | Protocole | Usage |
|------|-----------|--------|
| **22** | TCP | SSH (administration) — restreindre à ton IP fixe si le panneau le permet |
| **80** | TCP | HTTP (nginx, redirection HTTPS, Let’s Encrypt) |
| **443** | TCP | HTTPS (site `hackthebounty.fr`, API `api.hackthebounty.fr`) |

### Ports à ne pas ouvrir publiquement

| Port | Service | Raison |
|------|---------|--------|
| **3000** | API Nest (PM2) | Atteint uniquement via nginx en local (`127.0.0.1:3000`) |
| **3001** | Front Next (PM2) | Idem (`127.0.0.1:3001`) |
| **3306** | MariaDB/MySQL | Base accessible seulement en **local** ; consultation via SSH + `mysql` (voir ci-dessous) |

Flux attendu : `Internet → 80/443 (nginx) → 127.0.0.1:3001` (front) et `127.0.0.1:3000` (API).

Après modification des règles dans le panneau, vérifier depuis l’extérieur (ex. `curl -I https://hackthebounty.fr`) et que SSH reste joignable depuis ton IP si tu as restreint le port 22.

---

## Vérifier la base de données (MySQL / MariaDB en local)

Sur le VPS, MariaDB/MySQL écoute en **local** (`127.0.0.1:3306`). Le port **3306 ne doit pas** être ouvert sur le pare-feu public : l’accès se fait **en SSH** sur le serveur, puis via le client `mysql`.

Les identifiants applicatifs sont ceux de `server/.env` (`DATABASE_URL`), par ex. utilisateur `bugbountyapp`, base `bugbountyapp`. Le mot de passe n’est **jamais** documenté ici : utilise celui défini à la création du compte MySQL (`<mot-de-passe>`).

### Connexion

```bash
# Compte applicatif (recommandé pour consulter les données de l’app)
mysql -u bugbountyapp -p -h 127.0.0.1 bugbountyapp
# Saisir <mot-de-passe> quand il est demandé

# Accès administrateur (maintenance, création d’utilisateur, etc.)
sudo mysql
```

### Commandes utiles dans le client (`mysql>`)

```sql
SHOW DATABASES;
USE bugbountyapp;
SHOW TABLES;

DESCRIBE users;
SELECT * FROM users LIMIT 10;
SELECT COUNT(*) FROM users;

SELECT id, email, created_at FROM users ORDER BY id DESC LIMIT 20;
```

Quitter : `EXIT` ou `Ctrl+D`.

### Requêtes sans session interactive

```bash
mysql -u bugbountyapp -p -h 127.0.0.1 bugbountyapp -e "SHOW TABLES;"

mysql -u bugbountyapp -p -h 127.0.0.1 bugbountyapp -e "SELECT id, email FROM users LIMIT 5;"
```

(`-p` sans mot de passe sur la ligne de commande : il sera demandé interactivement.)

### Affichage

```sql
-- Dans mysql> : défilement pour les larges tables
pager less -SFX;
SELECT * FROM users LIMIT 5;

-- Une ligne en vertical
SELECT * FROM users WHERE id = 1\G
```

```bash
mysql -u bugbountyapp -p -h 127.0.0.1 bugbountyapp -t -e "SELECT * FROM users LIMIT 3;"
```

### Bonnes pratiques

- Préférer la **CLI + SSH** plutôt qu’Adminer exposé sur Internet.
- Utiliser `LIMIT` sur les grosses tables en production.
- Ne pas committer les mots de passe : ils restent dans `server/.env` (`chmod 600`).

---

## Premier compte SUPER_ADMIN (prod)

`POST /api/auth/register` exige **déjà** un JWT `SUPER_ADMIN` : impossible de créer le premier admin via l’UI ou Bruno sans compte existant. Utiliser le script one-shot (pas le seed démo `demo-user@example.local`).

**Prérequis :** migrations appliquées, rôles en base (`pnpm run prisma:seed` avec `SEED_DEMO_USER=false` en prod).

Sur le VPS (le mot de passe **n’est pas** dans `.env` : saisie masquée par le script) :

```bash
cd ~/bugbountyapp/server

pnpm run create-super-admin -- \
  --username "Lead" \
  --email "hackonline2030@gmail.com"
# → « Mot de passe super-admin : » puis confirmation (rien n’est affiché)
```

Seul `server/.env` contient `DATABASE_URL` / secrets serveur. **Ne pas** ajouter `SUPER_ADMIN_PASSWORD` dans `.env`.

Vérification :

```bash
mysql -u bugbountyapp -p -h 127.0.0.1 bugbountyapp -e \
  "SELECT u.id, u.username, u.email, r.name AS role FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE u.email = 'hackonline2030@gmail.com';"
```

Connexion : front → login avec **email** `hackonline2030@gmail.com` et le mot de passe choisi. Ensuite création d’autres comptes via **Administration → Inscription** (réservée aux super-admins).

Si l’email existe déjà, le script met à jour le mot de passe et force le rôle `SUPER_ADMIN`.

---

## PM2 — Next standalone + API + login

Le client a `output: "standalone"` dans `next.config.ts`. **Ne pas** lancer `pnpm start` (`next start`) en prod : PM2 doit exécuter **`node .next/standalone/server.js`** après `pnpm build` (le script `postbuild` copie `public/` et `.next/static`).

### Variables obligatoires avant `client` build

Fichier `client/.env.production` ou `client/.env` (lu au build) :

```env
NEXT_PUBLIC_SITE_URL=https://hackthebounty.fr
NEXT_PUBLIC_AUTH_API=https://api.hackthebounty.fr
NEXT_PUBLIC_AUTH_API_PREFIX=api
JWT_SECRET=<identique à server/.env>
```

`server/.env` (redémarrer l’API après modification) :

```env
CORS_ORIGIN=https://hackthebounty.fr,https://www.hackthebounty.fr
NODE_ENV=production
CHROMIUM_PATH=/usr/bin/chromium
```

### Nginx — CSP et login

Le login navigateur appelle **`https://api.hackthebounty.fr/api/auth/login`** depuis **`https://hackthebounty.fr`**. Si la CSP front contient seulement `connect-src 'self'`, le navigateur bloque l’API → « Erreur réseau ».

Dans le `server` HTTPS du front, inclure :

```nginx
connect-src 'self' https://api.hackthebounty.fr;
```

### Premier démarrage PM2 (une fois sur le VPS)

Enregistrer **api** et **next-app** via l’ecosystem (chemins, `PORT`, `HOSTNAME` déjà définis) :

```bash
cd ~/bugbountyapp
cp ecosystem.config.example.cjs ecosystem.config.cjs   # adapter user/chemins si besoin
pm2 start ecosystem.config.cjs
pm2 save
```

Alternative manuelle pour le front uniquement (depuis `client/`) :

```bash
cd ~/bugbountyapp/client
PORT=3001 HOSTNAME=127.0.0.1 NODE_ENV=production \
  pm2 start .next/standalone/server.js --name next-app
pm2 save
```

Après ce premier enregistrement, ne plus utiliser `pm2 delete next-app` puis `pm2 start` à chaque déploiement : PM2 recrée un processus et **incrémente l’id** à chaque fois. Utiliser **`pm2 restart next-app`** pour recharger le build standalone.

### Déploiement (sur le VPS)

```bash
cd ~/bugbountyapp
git pull

# API
cd server
pnpm install
pnpm exec prisma generate   # DATABASE_NAME=MYSQL_PRISMA dans .env
pnpm run build              # nx → dist/main.js
pm2 restart api

# Front (standalone : postbuild copie public/ et .next/static)
cd ../client
pnpm install
pnpm run build
pm2 restart next-app          # même id PM2, charge le nouveau server.js
```

Si `next-app` n’existe pas encore dans `pm2 list`, suivre la section **Premier démarrage PM2** ci-dessus au lieu de `restart`.

Variables d’env PM2 pour Next (dans `ecosystem.config.cjs`) : `PORT=3001`, `HOSTNAME=127.0.0.1`, `NODE_ENV=production`. Après modification du fichier : `pm2 restart next-app --update-env`.

### Chromium (export PDF)

```bash
sudo apt update
sudo apt install -y chromium
which chromium || which chromium-browser
```

Aligner `CHROMIUM_PATH` dans `server/.env` sur le chemin réel, puis `pm2 restart api`.

Alternative sans paquet système : `IS_PUPETTEER_WITH_CHROMIUM=true` dans `server/.env` (Puppeteer télécharge son Chromium — plus lourd).

### Logs utiles

```bash
pm2 list
pm2 logs api --lines 80
pm2 logs next-app --lines 80
sudo tail -f /var/log/nginx/error.log
```

Test login (CORS) depuis le VPS :

```bash
curl -sS -i -X POST https://api.hackthebounty.fr/api/auth/login \
  -H "Origin: https://hackthebounty.fr" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"x"}'
```

Attendu : HTTP **401** ou **200**, pas « connection refused ».

### Erreurs PM2 fréquentes

| Log | Cause | Action |
|-----|--------|--------|
| `next start` does not work with output: standalone | Mauvaise commande PM2 | `node .next/standalone/server.js` |
| Failed to find Server Action | Build / PM2 incohérents | `pnpm build` puis redémarrer next-app |
| Browser was not found at CHROMIUM_PATH | Chromium absent | `apt install chromium` + `CHROMIUM_PATH` |
| Erreur réseau (UI login) | CORS, CSP, ou `NEXT_PUBLIC_AUTH_API` localhost | Voir sections ci-dessus + rebuild client |
