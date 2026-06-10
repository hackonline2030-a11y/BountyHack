#!/bin/bash

# Script pour créer un dump MySQL natif depuis le conteneur Docker
# Usage: ./scripts/create-mysql-dump.sh [output-file]

set -e

# Configuration
CONTAINER_NAME="web-api-mysql"
DB_NAME="bugbountyapp"
DB_USER="bugbountyapp"
DB_PASSWORD="${MYSQL_PASSWORD:-bugbountyapp}"
OUTPUT_FILE="${1:-dump.mysql.native.$(date +%Y%m%d_%H%M%S).sql}"

echo "🐳 Création d'un dump MySQL natif..."
echo "   Conteneur: $CONTAINER_NAME"
echo "   Base: $DB_NAME"
echo "   Utilisateur: $DB_USER"
echo "   Fichier de sortie: $OUTPUT_FILE"

# Vérifier que le conteneur existe et fonctionne
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "❌ Erreur: Le conteneur '$CONTAINER_NAME' n'est pas en cours d'exécution"
    echo "   Démarrez-le avec: docker compose -f server/docker/compose.dev.yaml --profile mysql up -d"
    exit 1
fi

# Créer le dump avec mysqldump natif
docker exec "$CONTAINER_NAME" mysqldump \
    -u "$DB_USER" \
    -p"$DB_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --hex-blob \
    --default-character-set=utf8mb4 \
    --add-drop-table \
    --add-locks \
    --disable-keys \
    --extended-insert \
    "$DB_NAME" > "$OUTPUT_FILE"

echo "✅ Dump créé avec succès: $OUTPUT_FILE"
echo "📊 Taille du fichier: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo "📄 Nombre de lignes: $(wc -l < "$OUTPUT_FILE")"

# Afficher les premières lignes pour vérification
echo ""
echo "🔍 Aperçu du dump (premières lignes):"
head -10 "$OUTPUT_FILE"