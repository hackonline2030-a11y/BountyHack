# Script de Création d'Utilisateurs - seed_user.sh

Ce script permet de créer des utilisateurs dans la base de données BugBounty App directement via des commandes SQL, sans utiliser Docker.

## Prérequis

- **Node.js** (pour générer les hash de mots de passe)
- **Client de base de données** :
  - Pour MySQL : `mysql-client`
  - Pour PostgreSQL : `postgresql-client`
- **Base de données configurée** avec les tables Prisma

### Installation des clients de base de données

#### Ubuntu/Debian
```bash
# Pour MySQL
sudo apt install mysql-client

# Pour PostgreSQL
sudo apt install postgresql-client
```

#### CentOS/RHEL
```bash
# Pour MySQL
sudo yum install mysql

# Pour PostgreSQL
sudo yum install postgresql
```

## Utilisation

### 1. Mode Interactif (Recommandé)

Le mode interactif vous guide étape par étape :

```bash
# MySQL (XAMPP par exemple)
./seed_user.sh

# PostgreSQL
./seed_user.sh -t postgresql -u postgres -p motdepasse
```

### 2. Mode Batch (Automatisé)

Pour créer des utilisateurs en mode script :

```bash
# Créer un HUNTER
./seed_user.sh --batch \
  --username "hunter1" \
  --email "hunter1@test.com" \
  --user-password "password123" \
  --role "HUNTER" \
  --fake-user

# Créer un SUPER_ADMIN
./seed_user.sh --batch \
  -t mysql \
  -u root \
  -p "" \
  --username "admin" \
  --email "admin@test.com" \
  --user-password "admin123" \
  --role "SUPER_ADMIN"
```

## Options du Script

### Connexion à la base de données
- `-t, --type` : Type de base (mysql|postgresql) [défaut: mysql]
- `-H, --host` : Hôte [défaut: localhost]
- `-P, --port` : Port [défaut: 3306 pour MySQL, 5432 pour PostgreSQL]
- `-d, --database` : Nom de la base [défaut: bugbountyapp]
- `-u, --user` : Utilisateur de la base [défaut: root]
- `-p, --password` : Mot de passe de la base [défaut: vide]

### Utilisateur à créer
- `--username` : Nom d'utilisateur de l'app
- `--email` : Email de l'utilisateur
- `--user-password` : Mot de passe de l'utilisateur
- `--role` : Rôle (USER|SUPER_ADMIN|HUNTER|MENTOR|QUALITY_CHECKER|COORDINATOR|QUALITY_CONTENT)
- `--fake-user` : Marquer comme utilisateur de test
- `--batch` : Mode batch (pas d'interaction)

## Exemples d'Utilisation

### XAMPP (MySQL sans mot de passe)
```bash
./seed_user.sh -t mysql -u root -p ""
```

### PostgreSQL local
```bash
./seed_user.sh -t postgresql -u postgres -p mypassword
```

### Création en lot de plusieurs utilisateurs
```bash
#!/bin/bash
# Créer plusieurs utilisateurs de test

# Super Admin
./seed_user.sh --batch --username "admin" --email "admin@test.com" --user-password "admin123" --role "SUPER_ADMIN" --fake-user

# Hunter
./seed_user.sh --batch --username "hunter1" --email "hunter1@test.com" --user-password "hunter123" --role "HUNTER" --fake-user

# Quality Checker  
./seed_user.sh --batch --username "qc1" --email "qc1@test.com" --user-password "qc123" --role "QUALITY_CHECKER" --fake-user

# Mentor
./seed_user.sh --batch --username "mentor1" --email "mentor1@test.com" --user-password "mentor123" --role "MENTOR" --fake-user
```

## Rôles Disponibles

1. **USER** - Utilisateur de base
2. **SUPER_ADMIN** - Administrateur principal
3. **HUNTER** - Chercheur de vulnérabilités
4. **MENTOR** - Mentor/Formateur
5. **QUALITY_CHECKER** - Contrôleur qualité
6. **COORDINATOR** - Coordinateur d'équipe
7. **QUALITY_CONTENT** - Gestionnaire de contenu qualité

## Fonctionnalités

- ✅ **Validation automatique** : Vérifie la connexion DB, l'existence des tables et des rôles
- ✅ **Sécurité** : Hash des mots de passe avec scrypt (comme l'application)
- ✅ **Idempotent** : Met à jour l'utilisateur s'il existe déjà
- ✅ **Multi-DB** : Support MySQL et PostgreSQL
- ✅ **Auto-setup** : Crée les rôles par défaut s'ils n'existent pas
- ✅ **UUID** : Génère des UUID v4 pour les IDs utilisateur
- ✅ **Validation email** : Vérifie le format de l'email en mode interactif

## Dépannage

### Erreur "Command not found: mysql"
Installez le client MySQL :
```bash
sudo apt install mysql-client  # Ubuntu/Debian
sudo yum install mysql         # CentOS/RHEL
```

### Erreur "Access denied"
Vérifiez vos paramètres de connexion :
```bash
# Tester la connexion manuellement
mysql -u root -p -h localhost

# Ou pour PostgreSQL
psql -U postgres -h localhost
```

### La base n'existe pas
Créez la base de données :
```bash
# MySQL
mysql -u root -p -e "CREATE DATABASE bugbountyapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# PostgreSQL
createdb -U postgres bugbountyapp
```

### Les tables n'existent pas
Appliquez les migrations Prisma :
```bash
cd server
pnpm exec prisma migrate deploy
```

## Notes

- Les mots de passe sont hashés avec le même algorithme que l'application (scrypt)
- Les IDs utilisateur sont des UUID v4 générés automatiquement
- Le script vérifie automatiquement si l'utilisateur existe et propose une mise à jour
- En mode `--fake-user`, l'utilisateur est marqué comme compte de test