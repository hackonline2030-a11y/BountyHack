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
