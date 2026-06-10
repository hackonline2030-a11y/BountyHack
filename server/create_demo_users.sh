#!/bin/bash

# Script pour créer des utilisateurs de démonstration
# Utilise le script seed_user.sh pour créer plusieurs utilisateurs de test

set -e

# Configuration de la base de données (ajustez selon votre configuration)
DB_TYPE="mysql"      # mysql ou postgresql
DB_HOST="localhost"
DB_USER="root"
DB_PASS=""          # Mot de passe de la base (vide pour XAMPP par défaut)
DB_NAME="bugbountyapp"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Création des utilisateurs de démonstration BugBounty App ===${NC}"
echo ""

# Fonction pour créer un utilisateur
create_user() {
    local username="$1"
    local email="$2"
    local password="$3"
    local role="$4"
    
    echo -e "${GREEN}Création de l'utilisateur: $username ($email) - Rôle: $role${NC}"
    
    ./seed_user.sh --batch \
        --type "$DB_TYPE" \
        --host "$DB_HOST" \
        --user "$DB_USER" \
        --password "$DB_PASS" \
        --database "$DB_NAME" \
        --username "$username" \
        --email "$email" \
        --user-password "$password" \
        --role "$role" \
        --fake-user
    
    echo ""
}

# Vérifier que le script seed_user.sh existe
if [ ! -f "./seed_user.sh" ]; then
    echo "Erreur: Le script seed_user.sh n'existe pas dans le répertoire courant."
    echo "Assurez-vous d'exécuter ce script depuis le dossier server/"
    exit 1
fi

# Créer les utilisateurs de démonstration
echo "Configuration de la base de données :"
echo "  - Type: $DB_TYPE"
echo "  - Hôte: $DB_HOST"
echo "  - Utilisateur: $DB_USER"
echo "  - Base: $DB_NAME"
echo ""

# Super Admin
create_user "admin" "admin@bugbounty-demo.local" "admin123" "SUPER_ADMIN"

# Hunters
create_user "hunter1" "hunter1@bugbounty-demo.local" "hunter123" "HUNTER"
create_user "hunter2" "hunter2@bugbounty-demo.local" "hunter123" "HUNTER"
create_user "alice-hunter" "alice@bugbounty-demo.local" "alice123" "HUNTER"

# Quality Checkers
create_user "qc1" "qc1@bugbounty-demo.local" "qc123" "QUALITY_CHECKER"
create_user "bob-qc" "bob.qc@bugbounty-demo.local" "bob123" "QUALITY_CHECKER"

# Mentors
create_user "mentor1" "mentor1@bugbounty-demo.local" "mentor123" "MENTOR"
create_user "sarah-mentor" "sarah@bugbounty-demo.local" "sarah123" "MENTOR"

# Coordinator
create_user "coordinator" "coordinator@bugbounty-demo.local" "coord123" "COORDINATOR"

# Quality Content
create_user "content-manager" "content@bugbounty-demo.local" "content123" "QUALITY_CONTENT"

# Utilisateurs normaux
create_user "user1" "user1@bugbounty-demo.local" "user123" "USER"
create_user "john-user" "john@bugbounty-demo.local" "john123" "USER"

echo -e "${GREEN}=== Création terminée ===${NC}"
echo ""
echo "Utilisateurs créés :"
echo "┌─────────────────┬─────────────────────────────────┬──────────────────┬──────────────┐"
echo "│ Username        │ Email                           │ Password         │ Role         │"
echo "├─────────────────┼─────────────────────────────────┼──────────────────┼──────────────┤"
echo "│ admin           │ admin@bugbounty-demo.local      │ admin123         │ SUPER_ADMIN  │"
echo "│ hunter1         │ hunter1@bugbounty-demo.local    │ hunter123        │ HUNTER       │"
echo "│ hunter2         │ hunter2@bugbounty-demo.local    │ hunter123        │ HUNTER       │"
echo "│ alice-hunter    │ alice@bugbounty-demo.local      │ alice123         │ HUNTER       │"
echo "│ qc1             │ qc1@bugbounty-demo.local        │ qc123            │ QUALITY_CHECKER │"
echo "│ bob-qc          │ bob.qc@bugbounty-demo.local     │ bob123           │ QUALITY_CHECKER │"
echo "│ mentor1         │ mentor1@bugbounty-demo.local    │ mentor123        │ MENTOR       │"
echo "│ sarah-mentor    │ sarah@bugbounty-demo.local      │ sarah123         │ MENTOR       │"
echo "│ coordinator     │ coordinator@bugbounty-demo.local │ coord123         │ COORDINATOR  │"
echo "│ content-manager │ content@bugbounty-demo.local    │ content123       │ QUALITY_CONTENT │"
echo "│ user1           │ user1@bugbounty-demo.local      │ user123          │ USER         │"
echo "│ john-user       │ john@bugbounty-demo.local       │ john123          │ USER         │"
echo "└─────────────────┴─────────────────────────────────┴──────────────────┴──────────────┘"
echo ""
echo "Vous pouvez maintenant vous connecter à l'application avec n'importe lequel de ces comptes."
echo ""
echo "Exemple de connexion :"
echo "  Email: admin@bugbounty-demo.local"
echo "  Mot de passe: admin123"