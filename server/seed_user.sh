#!/bin/bash

# Script pour créer des utilisateurs dans la base de données BugBounty App
# Compatible avec MySQL (XAMPP) et PostgreSQL
# Utilisation: ./seed_user.sh [options]

set -e

# Configuration par défaut
DEFAULT_DB_TYPE="mysql"
DEFAULT_DB_HOST="localhost"
DEFAULT_DB_PORT_MYSQL="3306"
DEFAULT_DB_PORT_POSTGRES="5432"
DEFAULT_DB_NAME="bugbountyapp"
DEFAULT_DB_USER="root"
DEFAULT_DB_PASS=""

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'aide
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help                Afficher cette aide"
    echo "  -t, --type TYPE           Type de base (mysql|postgresql) [défaut: mysql]"
    echo "  -H, --host HOST           Hôte de la base [défaut: localhost]"
    echo "  -P, --port PORT           Port de la base [défaut: 3306 pour MySQL, 5432 pour PostgreSQL]"
    echo "  -d, --database DB         Nom de la base [défaut: bugbountyapp]"
    echo "  -u, --user USER           Utilisateur de la base [défaut: root]"
    echo "  -p, --password PASS       Mot de passe de la base [défaut: vide]"
    echo "  --username USERNAME       Nom d'utilisateur de l'app à créer"
    echo "  --email EMAIL             Email de l'utilisateur à créer"
    echo "  --user-password PASSWORD  Mot de passe de l'utilisateur à créer"
    echo "  --role ROLE               Rôle de l'utilisateur (USER|SUPER_ADMIN|HUNTER|MENTOR|QUALITY_CHECKER|COORDINATOR|QUALITY_CONTENT) [défaut: USER]"
    echo "  --fake-user              Marquer comme utilisateur de test (isFakeUser=true)"
    echo "  --batch                   Mode batch (pas d'interaction)"
    echo ""
    echo "Exemples:"
    echo "  # Création interactive avec MySQL (XAMPP)"
    echo "  $0"
    echo ""
    echo "  # Création avec PostgreSQL"
    echo "  $0 -t postgresql -u postgres -p mypassword"
    echo ""
    echo "  # Création en mode batch"
    echo "  $0 --batch --username hunter1 --email hunter@test.com --user-password password123 --role HUNTER"
    echo ""
    echo "  # Avec XAMPP (MySQL sans mot de passe)"
    echo "  $0 -t mysql -u root -p \"\""
}

# Fonction pour générer un hash de mot de passe (scrypt)
generate_password_hash() {
    local password="$1"
    node -e "
        const crypto = require('crypto');
        const password = '$password';
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.scryptSync(password, salt, 64).toString('hex');
        console.log(salt + ':' + hash);
    "
}

# Fonction pour générer un UUID v4
generate_uuid() {
    node -e "
        const crypto = require('crypto');
        console.log(crypto.randomUUID());
    "
}

# Fonction pour logger
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fonction pour vérifier les dépendances
check_dependencies() {
    log_info "Vérification des dépendances..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé. Requis pour générer les hash de mots de passe."
        exit 1
    fi
    
    # Vérifier le client de base de données selon le type
    if [ "$DB_TYPE" = "mysql" ]; then
        if ! command -v mysql &> /dev/null; then
            log_error "Client MySQL n'est pas installé."
            log_info "Pour installer sur Ubuntu/Debian: sudo apt install mysql-client"
            log_info "Pour installer sur CentOS/RHEL: sudo yum install mysql"
            exit 1
        fi
    elif [ "$DB_TYPE" = "postgresql" ]; then
        if ! command -v psql &> /dev/null; then
            log_error "Client PostgreSQL n'est pas installé."
            log_info "Pour installer sur Ubuntu/Debian: sudo apt install postgresql-client"
            log_info "Pour installer sur CentOS/RHEL: sudo yum install postgresql"
            exit 1
        fi
    fi
}

# Fonction pour tester la connexion à la base
test_db_connection() {
    log_info "Test de connexion à la base de données..."
    
    if [ "$DB_TYPE" = "mysql" ]; then
        if [ -z "$DB_PASS" ]; then
            mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -e "SELECT 1;" 2>/dev/null
        else
            mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1;" 2>/dev/null
        fi
    elif [ "$DB_TYPE" = "postgresql" ]; then
        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" >/dev/null 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        log_success "Connexion à la base de données réussie"
    else
        log_error "Impossible de se connecter à la base de données"
        log_info "Vérifiez vos paramètres de connexion:"
        log_info "  - Hôte: $DB_HOST"
        log_info "  - Port: $DB_PORT"
        log_info "  - Utilisateur: $DB_USER"
        log_info "  - Base: $DB_NAME"
        exit 1
    fi
}

# Fonction pour vérifier si la base existe
check_database_exists() {
    log_info "Vérification de l'existence de la base '$DB_NAME'..."
    
    if [ "$DB_TYPE" = "mysql" ]; then
        if [ -z "$DB_PASS" ]; then
            RESULT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -e "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$DB_NAME';" 2>/dev/null | grep -c "$DB_NAME")
        else
            RESULT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$DB_NAME';" 2>/dev/null | grep -c "$DB_NAME")
        fi
    elif [ "$DB_TYPE" = "postgresql" ]; then
        RESULT=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME';" 2>/dev/null | grep -c "1")
    fi
    
    if [ "$RESULT" -eq 0 ]; then
        log_error "La base de données '$DB_NAME' n'existe pas."
        log_info "Créez d'abord la base de données:"
        if [ "$DB_TYPE" = "mysql" ]; then
            log_info "  mysql -u $DB_USER -p -e \"CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\""
        else
            log_info "  createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME"
        fi
        exit 1
    else
        log_success "Base de données '$DB_NAME' trouvée"
    fi
}

# Fonction pour vérifier si les tables existent
check_tables_exist() {
    log_info "Vérification de l'existence des tables nécessaires..."
    
    if [ "$DB_TYPE" = "mysql" ]; then
        if [ -z "$DB_PASS" ]; then
            TABLES_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME' AND table_name IN ('users', 'roles');" 2>/dev/null | tail -1)
        else
            TABLES_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME' AND table_name IN ('users', 'roles');" 2>/dev/null | tail -1)
        fi
    elif [ "$DB_TYPE" = "postgresql" ]; then
        TABLES_COUNT=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('users', 'roles');" 2>/dev/null | tr -d ' ')
    fi
    
    if [ "$TABLES_COUNT" -lt 2 ]; then
        log_error "Les tables 'users' et 'roles' n'existent pas dans la base."
        log_info "Exécutez d'abord les migrations Prisma:"
        log_info "  cd server && pnpm exec prisma migrate deploy"
        exit 1
    else
        log_success "Tables nécessaires trouvées"
    fi
}

# Fonction pour vérifier si les rôles existent
ensure_roles_exist() {
    log_info "Vérification de l'existence des rôles..."
    
    if [ "$DB_TYPE" = "mysql" ]; then
        if [ -z "$DB_PASS" ]; then
            ROLES_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" -e "SELECT COUNT(*) FROM roles;" 2>/dev/null | tail -1)
        else
            ROLES_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) FROM roles;" 2>/dev/null | tail -1)
        fi
    elif [ "$DB_TYPE" = "postgresql" ]; then
        ROLES_COUNT=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM roles;" 2>/dev/null | tr -d ' ')
    fi
    
    if [ "$ROLES_COUNT" -eq 0 ]; then
        log_warning "Aucun rôle trouvé dans la base. Insertion des rôles par défaut..."
        insert_default_roles
    else
        log_success "Rôles trouvés dans la base ($ROLES_COUNT rôles)"
    fi
}

# Fonction pour insérer les rôles par défaut
insert_default_roles() {
    log_info "Insertion des rôles par défaut..."
    
    if [ "$DB_TYPE" = "mysql" ]; then
        ROLES_SQL="INSERT INTO roles (id, name) VALUES
            (1, 'USER'),
            (2, 'SUPER_ADMIN'),
            (3, 'HUNTER'),
            (4, 'MENTOR'),
            (5, 'QUALITY_CHECKER'),
            (6, 'COORDINATOR'),
            (7, 'QUALITY_CONTENT')
        ON DUPLICATE KEY UPDATE name = VALUES(name);"
        
        if [ -z "$DB_PASS" ]; then
            echo "$ROLES_SQL" | mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME"
        else
            echo "$ROLES_SQL" | mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME"
        fi
    elif [ "$DB_TYPE" = "postgresql" ]; then
        ROLES_SQL="INSERT INTO roles (id, name) VALUES
            (1, 'USER'),
            (2, 'SUPER_ADMIN'),
            (3, 'HUNTER'),
            (4, 'MENTOR'),
            (5, 'QUALITY_CHECKER'),
            (6, 'COORDINATOR'),
            (7, 'QUALITY_CONTENT')
        ON CONFLICT (id) DO NOTHING;"
        
        echo "$ROLES_SQL" | PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
    fi
    
    log_success "Rôles par défaut insérés"
}

# Fonction pour obtenir l'ID du rôle
get_role_id() {
    local role_name="$1"
    
    if [ "$DB_TYPE" = "mysql" ]; then
        if [ -z "$DB_PASS" ]; then
            ROLE_ID=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" -e "SELECT id FROM roles WHERE name = '$role_name';" 2>/dev/null | tail -1)
        else
            ROLE_ID=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT id FROM roles WHERE name = '$role_name';" 2>/dev/null | tail -1)
        fi
    elif [ "$DB_TYPE" = "postgresql" ]; then
        ROLE_ID=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT id FROM roles WHERE name = '$role_name';" 2>/dev/null | tr -d ' ')
    fi
    
    echo "$ROLE_ID"
}

# Fonction pour vérifier si un utilisateur existe
user_exists() {
    local email="$1"
    
    if [ "$DB_TYPE" = "mysql" ]; then
        if [ -z "$DB_PASS" ]; then
            COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" -e "SELECT COUNT(*) FROM users WHERE email = '$email';" 2>/dev/null | tail -1)
        else
            COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT COUNT(*) FROM users WHERE email = '$email';" 2>/dev/null | tail -1)
        fi
    elif [ "$DB_TYPE" = "postgresql" ]; then
        COUNT=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users WHERE email = '$email';" 2>/dev/null | tr -d ' ')
    fi
    
    [ "$COUNT" -gt 0 ]
}

# Fonction pour créer l'utilisateur
create_user() {
    local user_id="$1"
    local username="$2"
    local email="$3"
    local password_hash="$4"
    local role_id="$5"
    local is_fake_user="$6"
    
    log_info "Création de l'utilisateur '$username' ($email)..."
    
    if [ "$DB_TYPE" = "mysql" ]; then
        USER_SQL="INSERT INTO users (id, username, email, password_hash, role_id, is_fake_user) 
                  VALUES ('$user_id', '$username', '$email', '$password_hash', $role_id, $is_fake_user)
                  ON DUPLICATE KEY UPDATE 
                    username = VALUES(username),
                    password_hash = VALUES(password_hash),
                    role_id = VALUES(role_id),
                    is_fake_user = VALUES(is_fake_user);"
        
        if [ -z "$DB_PASS" ]; then
            echo "$USER_SQL" | mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME"
        else
            echo "$USER_SQL" | mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME"
        fi
    elif [ "$DB_TYPE" = "postgresql" ]; then
        USER_SQL="INSERT INTO users (id, username, email, password_hash, role_id, is_fake_user) 
                  VALUES ('$user_id', '$username', '$email', '$password_hash', $role_id, $is_fake_user)
                  ON CONFLICT (id) DO UPDATE SET
                    username = EXCLUDED.username,
                    password_hash = EXCLUDED.password_hash,
                    role_id = EXCLUDED.role_id,
                    is_fake_user = EXCLUDED.is_fake_user;"
        
        echo "$USER_SQL" | PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
    fi
    
    if [ $? -eq 0 ]; then
        log_success "Utilisateur créé avec succès!"
        log_info "Détails de l'utilisateur:"
        log_info "  - ID: $user_id"
        log_info "  - Nom d'utilisateur: $username"
        log_info "  - Email: $email"
        log_info "  - Rôle ID: $role_id"
        log_info "  - Utilisateur de test: $is_fake_user"
    else
        log_error "Échec de la création de l'utilisateur"
        exit 1
    fi
}

# Fonction pour saisie interactive
interactive_input() {
    echo ""
    log_info "=== Création d'utilisateur BugBounty App ==="
    echo ""
    
    # Nom d'utilisateur
    read -p "Nom d'utilisateur: " APP_USERNAME
    while [ -z "$APP_USERNAME" ]; do
        log_warning "Le nom d'utilisateur ne peut pas être vide"
        read -p "Nom d'utilisateur: " APP_USERNAME
    done
    
    # Email
    read -p "Email: " APP_EMAIL
    while [ -z "$APP_EMAIL" ] || [[ ! "$APP_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; do
        log_warning "Veuillez entrer un email valide"
        read -p "Email: " APP_EMAIL
    done
    
    # Vérifier si l'utilisateur existe déjà
    if user_exists "$APP_EMAIL"; then
        log_warning "Un utilisateur avec cet email existe déjà. Il sera mis à jour."
        read -p "Continuer ? (y/N): " CONTINUE
        if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
            log_info "Opération annulée"
            exit 0
        fi
    fi
    
    # Mot de passe
    read -s -p "Mot de passe: " APP_USER_PASSWORD
    echo ""
    while [ -z "$APP_USER_PASSWORD" ]; do
        log_warning "Le mot de passe ne peut pas être vide"
        read -s -p "Mot de passe: " APP_USER_PASSWORD
        echo ""
    done
    
    # Confirmer le mot de passe
    read -s -p "Confirmer le mot de passe: " PASSWORD_CONFIRM
    echo ""
    while [ "$APP_USER_PASSWORD" != "$PASSWORD_CONFIRM" ]; do
        log_warning "Les mots de passe ne correspondent pas"
        read -s -p "Mot de passe: " APP_USER_PASSWORD
        echo ""
        read -s -p "Confirmer le mot de passe: " PASSWORD_CONFIRM
        echo ""
    done
    
    # Rôle
    echo ""
    log_info "Rôles disponibles:"
    echo "  1) USER"
    echo "  2) SUPER_ADMIN"
    echo "  3) HUNTER"
    echo "  4) MENTOR"
    echo "  5) QUALITY_CHECKER"
    echo "  6) COORDINATOR"
    echo "  7) QUALITY_CONTENT"
    echo ""
    read -p "Choisissez un rôle (1-7) [défaut: 1]: " ROLE_CHOICE
    
    case "$ROLE_CHOICE" in
        1|"") APP_ROLE="USER" ;;
        2) APP_ROLE="SUPER_ADMIN" ;;
        3) APP_ROLE="HUNTER" ;;
        4) APP_ROLE="MENTOR" ;;
        5) APP_ROLE="QUALITY_CHECKER" ;;
        6) APP_ROLE="COORDINATOR" ;;
        7) APP_ROLE="QUALITY_CONTENT" ;;
        *) 
            log_warning "Choix invalide, utilisation de USER par défaut"
            APP_ROLE="USER"
            ;;
    esac
    
    # Utilisateur de test
    read -p "Marquer comme utilisateur de test ? (y/N): " IS_FAKE_CHOICE
    if [ "$IS_FAKE_CHOICE" = "y" ] || [ "$IS_FAKE_CHOICE" = "Y" ]; then
        APP_FAKE_USER="true"
    else
        APP_FAKE_USER="false"
    fi
}

# Parsing des arguments
DB_TYPE="$DEFAULT_DB_TYPE"
DB_HOST="$DEFAULT_DB_HOST"
DB_PORT=""
DB_NAME="$DEFAULT_DB_NAME"
DB_USER="$DEFAULT_DB_USER"
DB_PASS="$DEFAULT_DB_PASS"
APP_USERNAME=""
APP_EMAIL=""
APP_USER_PASSWORD=""
APP_ROLE="USER"
APP_FAKE_USER="false"
BATCH_MODE="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -t|--type)
            DB_TYPE="$2"
            shift 2
            ;;
        -H|--host)
            DB_HOST="$2"
            shift 2
            ;;
        -P|--port)
            DB_PORT="$2"
            shift 2
            ;;
        -d|--database)
            DB_NAME="$2"
            shift 2
            ;;
        -u|--user)
            DB_USER="$2"
            shift 2
            ;;
        -p|--password)
            DB_PASS="$2"
            shift 2
            ;;
        --username)
            APP_USERNAME="$2"
            shift 2
            ;;
        --email)
            APP_EMAIL="$2"
            shift 2
            ;;
        --user-password)
            APP_USER_PASSWORD="$2"
            shift 2
            ;;
        --role)
            APP_ROLE="$2"
            shift 2
            ;;
        --fake-user)
            APP_FAKE_USER="true"
            shift
            ;;
        --batch)
            BATCH_MODE="true"
            shift
            ;;
        *)
            log_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

# Définir le port par défaut selon le type de DB
if [ -z "$DB_PORT" ]; then
    if [ "$DB_TYPE" = "mysql" ]; then
        DB_PORT="$DEFAULT_DB_PORT_MYSQL"
    elif [ "$DB_TYPE" = "postgresql" ]; then
        DB_PORT="$DEFAULT_DB_PORT_POSTGRES"
    fi
fi

# Valider le type de DB
if [ "$DB_TYPE" != "mysql" ] && [ "$DB_TYPE" != "postgresql" ]; then
    log_error "Type de base de données non supporté: $DB_TYPE"
    log_info "Types supportés: mysql, postgresql"
    exit 1
fi

# Vérifications préliminaires
check_dependencies
test_db_connection
check_database_exists
check_tables_exist
ensure_roles_exist

# Mode batch ou interactif
if [ "$BATCH_MODE" = "true" ]; then
    # Vérifier que tous les paramètres requis sont fournis
    if [ -z "$APP_USERNAME" ] || [ -z "$APP_EMAIL" ] || [ -z "$APP_USER_PASSWORD" ]; then
        log_error "En mode batch, --username, --email et --user-password sont requis"
        exit 1
    fi
else
    interactive_input
fi

# Générer l'ID utilisateur (UUID)
USER_ID=$(generate_uuid)

# Générer le hash du mot de passe
log_info "Génération du hash de mot de passe..."
PASSWORD_HASH=$(generate_password_hash "$APP_USER_PASSWORD")

# Obtenir l'ID du rôle
ROLE_ID=$(get_role_id "$APP_ROLE")
if [ -z "$ROLE_ID" ]; then
    log_error "Rôle '$APP_ROLE' non trouvé dans la base de données"
    exit 1
fi

# Créer l'utilisateur
create_user "$USER_ID" "$APP_USERNAME" "$APP_EMAIL" "$PASSWORD_HASH" "$ROLE_ID" "$APP_FAKE_USER"

log_success "Script terminé avec succès!"