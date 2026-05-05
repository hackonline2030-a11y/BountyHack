#!/usr/bin/env bash
# Stack dev Docker (compose.dev.yaml).
# - MongoDB + mongo-express si DATABASE_NAME=MONGODB
# - PostgreSQL + pgweb si DATABASE_NAME=POSTGRESQL
# (voir server/.env.example ; pas encore de pilote applicatif Postgres dans le code.)
# Depuis la racine du repo :
#   ./docker/start.sh          # ou ./docker/start.sh up
#   ./docker/start.sh down     # arrête tout (y compris api-watch) + --remove-orphans
#   ./docker/start.sh down -v  # idem + supprime les volumes (Mongo, node_modules vol., …)
#   ./docker/start.sh api-restart   # redémarre API (+ Mongo si profil mongodb), sans rebuild
#   ./docker/start.sh api-stop      # stoppe API (+ Mongo si profil mongodb)
#   ./docker/start.sh logs          # suit les logs API uniquement
#   ./docker/start.sh watch-up      # démarre API en mode watch (bind mount + hot reload)
#   ./docker/start.sh watch-stop    # stoppe API watch (et Mongo si profil mongodb)

set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_BASE="${PROJECT_DIR}/compose.dev.yaml"
SERVICE_NAME="web-api-mongodb"
API_NAME="web-api"
MONGO_EXPRESS_PORT="8086"
MONGO_URI_HOST="mongodb://localhost:27017"
MONGO_URI_DOCKER="mongodb://mongodb:27017"
POSTGRES_SERVICE="web-api-postgres"
PGWEB_DEFAULT_PORT="8087"
USERS_DUMP_FILE="${PROJECT_DIR}/dump/user.json"
USERS_PG_DUMP_FILE="${PROJECT_DIR}/dump/users_postgres.sql"
API_PORT="${API_HOST_PORT:-3003}"
API_LOGS_UP_COMMAND="docker compose -f compose.dev.yaml logs -f"
FOLLOW_API_LOGS="${API_FOLLOW_LOGS:-1}"

info()  { echo -e "ℹ️  $1"; }
ok()    { echo -e "✅ $1"; }
warn()  { echo -e "⚠️  $1"; }
error() { echo -e "❌ $1"; }

read_database_name() {
  local f="${PROJECT_DIR}/../.env"
  local raw
  if [[ ! -f "$f" ]]; then
    echo "POSTGRESQL"
    return
  fi
  raw=$(grep -E '^[[:space:]]*DATABASE_NAME=' "$f" | head -1 || true)
  if [[ -z "$raw" ]]; then
    echo "POSTGRESQL"
    return
  fi
  raw="${raw#*=}"
  raw="${raw%%#*}"
  raw=$(echo "$raw" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '"' | tr -d "'")
  [[ -n "$raw" ]] && echo "$raw" || echo "POSTGRESQL"
}

DATABASE_NAME_VALUE="$(read_database_name)"
USE_MONGO=false
USE_POSTGRES=false
if [[ "$DATABASE_NAME_VALUE" == "MONGODB" ]]; then
  USE_MONGO=true
fi
if [[ "$DATABASE_NAME_VALUE" == "POSTGRESQL" || "$DATABASE_NAME_VALUE" == "POSTGRESQL_PRISMA" ]]; then
  USE_POSTGRES=true
fi

PROFILE_ARGS=()
if [[ "$USE_MONGO" == true ]]; then
  PROFILE_ARGS=(--profile mongodb)
elif [[ "$USE_POSTGRES" == true ]]; then
  PROFILE_ARGS=(--profile pg)
fi
WATCH_PROFILE_ARGS=(--profile watch)
if [[ "$USE_MONGO" == true ]]; then
  WATCH_PROFILE_ARGS=(--profile watch --profile mongodb)
elif [[ "$USE_POSTGRES" == true ]]; then
  WATCH_PROFILE_ARGS=(--profile watch --profile pg)
fi

# Pour « down » : activer watch + les deux profils bases possibles pour tout arrêter même si .env a changé entre temps.
DOWN_PROFILE_ARGS=(--profile watch --profile mongodb --profile pg)

cd "$PROJECT_DIR" || {
  error "Project directory not found: $PROJECT_DIR"
  exit 1
}

if ! command -v docker >/dev/null 2>&1; then
  error "docker is required but not found in PATH."
  exit 1
fi

compose=(docker compose)
if ! docker compose version >/dev/null 2>&1; then
  if command -v docker-compose >/dev/null 2>&1; then
    compose=(docker-compose)
  else
    error "docker compose (or docker-compose) is required."
    exit 1
  fi
fi

ACTION="${1:-up}"
case "$ACTION" in
  watch-up|dev-up)
    shift || true
    info "Starting API in watch mode (live reload, no rebuild loop)…"
    info "Stopping classic api container first to free host port ${API_PORT} (if running)…"
    if [[ "$USE_MONGO" == true || "$USE_POSTGRES" == true ]]; then
      "${compose[@]}" -f "$COMPOSE_BASE" "${PROFILE_ARGS[@]}" stop api >/dev/null 2>&1 || true
    else
      "${compose[@]}" -f "$COMPOSE_BASE" stop api >/dev/null 2>&1 || true
    fi
    if [[ "$USE_MONGO" == true ]]; then
      info "DATABASE_NAME=MONGODB → start MongoDB + api-watch."
      if ! "${compose[@]}" -f "$COMPOSE_BASE" "${WATCH_PROFILE_ARGS[@]}" up -d --build mongodb mongo-express api-watch "$@"; then
        error "docker compose up watch mode failed"
        exit 1
      fi
    elif [[ "$USE_POSTGRES" == true ]]; then
      info "DATABASE_NAME=POSTGRESQL → start PostgreSQL + pgweb + api-watch."
      if ! "${compose[@]}" -f "$COMPOSE_BASE" "${WATCH_PROFILE_ARGS[@]}" up -d --build postgres pgweb api-watch "$@"; then
        error "docker compose up watch mode (Postgres) failed"
        exit 1
      fi
    else
      info "DATABASE_NAME=$DATABASE_NAME_VALUE → start api-watch only."
      if ! "${compose[@]}" -f "$COMPOSE_BASE" "${WATCH_PROFILE_ARGS[@]}" up -d --build api-watch "$@"; then
        error "docker compose up api-watch failed"
        exit 1
      fi
    fi
    ok "Watch mode started. Following live api-watch logs…"
    "${compose[@]}" -f "$COMPOSE_BASE" "${WATCH_PROFILE_ARGS[@]}" logs -f api-watch
    exit 0
    ;;
  watch-stop|dev-stop)
    shift || true
    info "Stopping API watch mode…"
    if [[ "$USE_MONGO" == true ]]; then
      if ! "${compose[@]}" -f "$COMPOSE_BASE" "${WATCH_PROFILE_ARGS[@]}" stop api-watch mongo-express mongodb "$@"; then
        error "docker compose stop api-watch mongodb failed"
        exit 1
      fi
    elif [[ "$USE_POSTGRES" == true ]]; then
      if ! "${compose[@]}" -f "$COMPOSE_BASE" "${WATCH_PROFILE_ARGS[@]}" stop api-watch pgweb postgres "$@"; then
        error "docker compose stop api-watch postgres failed"
        exit 1
      fi
    else
      if ! "${compose[@]}" -f "$COMPOSE_BASE" "${WATCH_PROFILE_ARGS[@]}" stop api-watch "$@"; then
        error "docker compose stop api-watch failed"
        exit 1
      fi
    fi
    ok "Watch mode stopped."
    exit 0
    ;;
  logs)
    shift || true
    info "Following API logs only (Ctrl+C to stop tail)…"
    if [[ "$USE_MONGO" == true || "$USE_POSTGRES" == true ]]; then
      "${compose[@]}" -f "$COMPOSE_BASE" "${PROFILE_ARGS[@]}" logs -f api "$@"
    else
      "${compose[@]}" -f "$COMPOSE_BASE" logs -f api "$@"
    fi
    exit 0
    ;;
  dump-users)
    shift || true
    if [[ "$USE_MONGO" != true ]]; then
      error "DATABASE_NAME must be MONGODB to import users dump."
      exit 1
    fi
    if [[ ! -f "$USERS_DUMP_FILE" ]]; then
      error "Dump file not found: $USERS_DUMP_FILE"
      exit 1
    fi

    info "Ensuring MongoDB container is running…"
    if ! "${compose[@]}" -f "$COMPOSE_BASE" "${PROFILE_ARGS[@]}" up -d mongodb; then
      error "Unable to start mongodb service"
      exit 1
    fi

    info "Importing users dump into bugbountyapp.users (drop + jsonArray)…"
    if ! docker exec -i "$SERVICE_NAME" mongoimport --db bugbountyapp --collection users --jsonArray --drop < "$USERS_DUMP_FILE"; then
      error "mongoimport failed"
      exit 1
    fi

    ok "Users dump imported successfully into bugbountyapp.users."
    exit 0
    ;;
  dump-users-pg)
    shift || true
    if [[ "$USE_POSTGRES" != true ]]; then
      error "DATABASE_NAME must be POSTGRESQL or POSTGRESQL_PRISMA for dump-users-pg."
      exit 1
    fi
    if [[ ! -f "$USERS_PG_DUMP_FILE" ]]; then
      error "Dump SQL not found: $USERS_PG_DUMP_FILE"
      exit 1
    fi

    info "Ensuring PostgreSQL container is running…"
    if ! "${compose[@]}" -f "$COMPOSE_BASE" "${PROFILE_ARGS[@]}" up -d postgres; then
      error "Unable to start postgres service"
      exit 1
    fi

    info "Waiting for Postgres to be ready…"
    n=0
    until docker exec "$POSTGRES_SERVICE" pg_isready >/dev/null 2>&1; do
      n=$((n + 1))
      if [[ "$n" -gt 60 ]]; then
        error "Postgres did not become ready in time."
        exit 1
      fi
      sleep 1
    done

    pu=$(docker exec "$POSTGRES_SERVICE" printenv POSTGRES_USER 2>/dev/null | tr -d '\r')
    pd=$(docker exec "$POSTGRES_SERVICE" printenv POSTGRES_DB 2>/dev/null | tr -d '\r')
    [[ -z "$pu" ]] && pu=bugbountyapp
    [[ -z "$pd" ]] && pd=bugbountyapp

    info "Importing users seed SQL into Postgres (idempotent upsert)…"
    if ! docker exec -i "$POSTGRES_SERVICE" psql -U "$pu" -d "$pd" -v ON_ERROR_STOP=1 < "$USERS_PG_DUMP_FILE"; then
      error "psql import failed (table users missing? Run: cd server && pnpm prisma:migrate:deploy)"
      exit 1
    fi

    ok "Users seed applied — check pgweb (users) or: docker exec -it $POSTGRES_SERVICE psql -U ... -d ... -c 'SELECT * FROM users;'"
    exit 0
    ;;
  api-stop|stop-api)
    shift || true
    info "Stopping API only (and DB dependency when enabled)…"
    if [[ "$USE_MONGO" == true ]]; then
      info "DATABASE_NAME=MONGODB → arrêt API + MongoDB (profil « mongodb »)."
      if ! "${compose[@]}" -f "$COMPOSE_BASE" "${PROFILE_ARGS[@]}" stop api mongodb "$@"; then
        error "docker compose stop api mongodb failed"
        exit 1
      fi
    elif [[ "$USE_POSTGRES" == true ]]; then
      info "DATABASE_NAME=POSTGRESQL → arrêt API + PostgreSQL + pgweb (profil « pg »)."
      if ! "${compose[@]}" -f "$COMPOSE_BASE" "${PROFILE_ARGS[@]}" stop api pgweb postgres "$@"; then
        error "docker compose stop api postgres failed"
        exit 1
      fi
    else
      info "DATABASE_NAME=$DATABASE_NAME_VALUE → arrêt API seule (sans profil base Docker)."
      if ! "${compose[@]}" -f "$COMPOSE_BASE" stop api "$@"; then
        error "docker compose stop api failed"
        exit 1
      fi
    fi
    ok "API stopped without rebuilding images."
    exit 0
    ;;
  api-restart|restart-api)
    shift || true
    info "Restarting API only (no image rebuild)…"
    if [[ "$USE_MONGO" == true ]]; then
      info "DATABASE_NAME=MONGODB → (re)start MongoDB + API avec profil « mongodb »."
      if ! "${compose[@]}" -f "$COMPOSE_BASE" "${PROFILE_ARGS[@]}" up -d --no-build mongodb api "$@"; then
        error "docker compose up --no-build mongodb api failed"
        exit 1
      fi
    elif [[ "$USE_POSTGRES" == true ]]; then
      info "DATABASE_NAME=POSTGRESQL → (re)start PostgreSQL + API avec profil « pg »."
      if ! "${compose[@]}" -f "$COMPOSE_BASE" "${PROFILE_ARGS[@]}" up -d --no-build postgres api "$@"; then
        error "docker compose up --no-build postgres api failed"
        exit 1
      fi
    else
      info "DATABASE_NAME=$DATABASE_NAME_VALUE → (re)start API seule, sans profil base Docker."
      if ! "${compose[@]}" -f "$COMPOSE_BASE" up -d --no-build api "$@"; then
        error "docker compose up --no-build api failed"
        exit 1
      fi
    fi

    ok "API restarted without rebuilding images."
    info "Container status:"
    if [[ "$USE_MONGO" == true || "$USE_POSTGRES" == true ]]; then
      "${compose[@]}" -f "$COMPOSE_BASE" "${PROFILE_ARGS[@]}" ps
    else
      "${compose[@]}" -f "$COMPOSE_BASE" ps
    fi
    exit 0
    ;;
  stop)
    shift || true
    info "Stopping all stack containers (api, api-watch, mongodb, mongo-express if present)…"
    # Activate both profiles so stop works whether stack was started via up or watch-up.
    if ! "${compose[@]}" -f "$COMPOSE_BASE" --profile watch --profile mongodb --profile pg stop "$@"; then
      error "docker compose stop failed"
      exit 1
    fi
    ok "All stack containers are stopped."
    exit 0
    ;;
  down)
    shift
    info "Stopping dev stack (profils watch + mongodb + pg)…"
    info "Inclut tout service éventuellement démarré (Mongo, Postgres, api-watch)."
    if ! "${compose[@]}" -f "$COMPOSE_BASE" "${DOWN_PROFILE_ARGS[@]}" down --remove-orphans "$@"; then
      error "docker compose down failed"
      exit 1
    fi
    ok "Stack arrêtée (projet web-api-dev) — conteneurs orphelins supprimés."
    exit 0
    ;;
  -h|--help|help)
    echo "Usage: $0 [up|stop|down|api-restart|api-stop|logs|watch-up|watch-stop|dump-users|dump-users-pg] [options]"
    echo ""
    echo "  up (default)   Démarre la stack (build si besoin)."
    echo "  stop             Stoppe tous les conteneurs de la stack (up + watch-up), sans supprimer réseau/volumes."
    echo "  down             Arrête tout (y compris api-watch), supprime le réseau, --remove-orphans."
    echo "  down -v          Idem + supprime les volumes compose (Mongo, web_api_node_modules, …)."
    echo "  api-restart      Redémarre API sans rebuild (MongoDB si MONGODB, Postgres si POSTGRESQL)."
    echo "  api-stop         Stoppe API (et MongoDB si MONGODB, Postgres+pgweb si POSTGRESQL)."
    echo "  logs             Suit les logs API uniquement."
    echo "  watch-up         Démarre API en mode watch (bind mount + hot reload dans le conteneur)."
    echo "  watch-stop       Stoppe API watch (et MongoDB / Postgres selon DATABASE_NAME)."
    echo "  dump-users       Importe docker/dump/user.json dans MongoDB (MONGODB uniquement)."
    echo "  dump-users-pg    Importe docker/dump/users_postgres.sql (POSTGRESQL / POSTGRESQL_PRISMA) — table users requise."
    echo ""
    echo "Depuis le dossier docker/ (ou en passant le chemin) : ./start.sh   ou   ./start"
    exit 0
    ;;
  up|start)
    [[ -n "${1:-}" ]] && shift
    ;;
  *)
    error "Commande inconnue : $ACTION — utilisation : $0 [up|stop|down|dump-users|dump-users-pg] (ou $0 --help)"
    exit 1
    ;;
esac

# ---------- up ----------
if [[ "$USE_MONGO" == true ]]; then
  info "Starting dev stack (API in Docker + MongoDB + mongo-express)…"
elif [[ "$USE_POSTGRES" == true ]]; then
  info "Starting dev stack (API in Docker + PostgreSQL + pgweb)…"
else
  info "Starting dev stack (API in Docker, pas de base Docker Compose pour ce DATABASE_NAME)…"
fi

if [[ ! -f "${PROJECT_DIR}/../.env" ]]; then
  warn "Project .env missing — copy .env.example to .env (JWT_SECRET, etc.) before the API can run correctly."
fi

if [[ "$USE_MONGO" == true ]]; then
  info "DATABASE_NAME=MONGODB → MongoDB + mongo-express."
  if [[ -f "${PROJECT_DIR}/../.env" ]]; then
    db_url_line=$(grep -E '^[[:space:]]*DATABASE_URL=' "${PROJECT_DIR}/../.env" | head -1 || true)
    if [[ "$db_url_line" == *localhost* ]]; then
      warn "DATABASE_URL utilise encore localhost alors que l'API Docker doit joindre le service « mongodb » — voir .env.example (section alternative MongoDB)."
    fi
  fi
elif [[ "$USE_POSTGRES" == true ]]; then
  info "DATABASE_NAME=POSTGRESQL / POSTGRESQL_PRISMA → PostgreSQL + pgweb."
  if [[ -f "${PROJECT_DIR}/../.env" ]]; then
    db_url_line=$(grep -E '^[[:space:]]*DATABASE_URL=' "${PROJECT_DIR}/../.env" | head -1 || true)
    if [[ "$db_url_line" == *localhost* ]] && [[ "$db_url_line" == *postgres* || "$db_url_line" == *postgresql* ]]; then
      warn "DATABASE_URL pointe encore vers localhost pour Postgres : dans Docker, l’hôte est le service « postgres » (ex. postgres://user:pass@postgres:5432/db), pas localhost — voir .env.example."
    fi
  fi
else
  info "DATABASE_NAME=$DATABASE_NAME_VALUE → pas de conteneurs Mongo/Postgres (profils « mongodb » / « pg » désactivés)."
fi

if [[ "$USE_MONGO" == true ]]; then
  info "Si les ports 27017, ${API_PORT} ou 8086 sont pris, arrête les services en conflit puis relance."
elif [[ "$USE_POSTGRES" == true ]]; then
  info "Si les ports ${POSTGRES_HOST_PORT:-5432}, ${API_PORT} ou ${PGWEB_HOST_PORT:-${PGWEB_DEFAULT_PORT}} sont pris, arrête les services en conflit puis relance."
else
  info "Si le port ${API_PORT} est pris, arrête le service en conflit puis relance."
fi

if [[ "$USE_MONGO" == true || "$USE_POSTGRES" == true ]]; then
  if ! "${compose[@]}" -f "$COMPOSE_BASE" "${PROFILE_ARGS[@]}" up -d --build; then
    error "Docker Compose failed to start"
    exit 1
  fi
else
  if ! "${compose[@]}" -f "$COMPOSE_BASE" up -d --build; then
    error "Docker Compose failed to start"
    exit 1
  fi
fi

ok "Containers started (first run may take a while to build the API image)"

echo ""
info "Checking container status..."
if [[ "$USE_MONGO" == true || "$USE_POSTGRES" == true ]]; then
  "${compose[@]}" -f "$COMPOSE_BASE" "${PROFILE_ARGS[@]}" ps
else
  "${compose[@]}" -f "$COMPOSE_BASE" ps
fi

if [[ "$USE_MONGO" == true ]]; then
  info "Waiting for MongoDB to become ready…"
  READY=false
  for _ in {1..15}; do
    if docker exec "$SERVICE_NAME" mongosh --quiet --eval "db.runCommand({ ping: 1 })" >/dev/null 2>&1; then
      READY=true
      break
    fi
    sleep 2
  done

  if [ "$READY" = false ]; then
    warn "MongoDB did not respond to ping in time"
    info "Showing recent logs:"
    docker logs "$SERVICE_NAME" --tail 30
    exit 1
  fi

  ok "MongoDB is ready"

  echo ""
  info "Recent MongoDB logs:"
  docker logs "$SERVICE_NAME" --tail 10
fi

if [[ "$USE_POSTGRES" == true ]]; then
  info "Waiting for PostgreSQL to become ready…"
  READY_PG=false
  for _ in {1..15}; do
    if docker exec "$POSTGRES_SERVICE" pg_isready >/dev/null 2>&1; then
      READY_PG=true
      break
    fi
    sleep 2
  done

  if [ "$READY_PG" = false ]; then
    warn "PostgreSQL did not become ready in time"
    info "Showing recent logs:"
    docker logs "$POSTGRES_SERVICE" --tail 30
    exit 1
  fi

  ok "PostgreSQL is ready"

  PGWEB_SLUG_PORT="${PGWEB_HOST_PORT:-${PGWEB_DEFAULT_PORT}}"
  info "pgweb — ouvre http://localhost:${PGWEB_SLUG_PORT}/ (slug / ; conteneur web-api-pgweb, PGWEB_HOST_PORT dans .env)"

  echo ""
  info "Recent PostgreSQL logs:"
  docker logs "$POSTGRES_SERVICE" --tail 10
fi

echo ""
info "Recent API logs:"
docker logs "$API_NAME" --tail 15 2>/dev/null || warn "API container not logging yet — check: docker logs $API_NAME"

echo ""
echo "----------------------------------"
ok "Dev stack is running"
echo ""
echo "📂 Arrêt : ./docker/start.sh down"
echo "📂 Prochaine fois :"
echo "   ./docker/start.sh"
echo ""
if [[ "$USE_MONGO" == true ]]; then
  echo "📡 MongoDB — accès depuis l’hôte (port 27017 mappé) : ${MONGO_URI_HOST}/bugbountyapp"
  echo "   (mongosh, drivers sur ta machine, mongo-express utilisent cette URL.)"
  echo "📡 Même Mongo — accès depuis le conteneur « api » : ${MONGO_URI_DOCKER}/bugbountyapp"
  echo "   (DATABASE_URL dans .env pour l’API Docker ; hôte du service = nom Compose « mongodb », pas localhost.)"
  echo "🧭 Mongo Express:  http://localhost:${MONGO_EXPRESS_PORT}"
fi
if [[ "$USE_POSTGRES" == true ]]; then
  PGWEB_SLUG_PORT="${PGWEB_HOST_PORT:-${PGWEB_DEFAULT_PORT}}"
  echo "📡 PostgreSQL — depuis l’hôte : port ${POSTGRES_HOST_PORT:-5432} (utilisateur / mot / base = POSTGRES_* dans .env, défauts bugbountyapp)."
  echo "📡 Depuis le conteneur « api » : hôte « postgres », port 5432 (adapter DATABASE_URL en conséquence)."
  echo "🧭 pgweb (UI SQL) : http://localhost:${PGWEB_SLUG_PORT}/"
  echo "   └─ slug d’accès : / (racine) — conteneur web-api-pgweb — port hôte : ${PGWEB_SLUG_PORT} (surcharge .env : PGWEB_HOST_PORT)"
fi
echo "🚀 API (Docker):   http://localhost:${API_PORT}/api"
echo ""
if [[ "$USE_MONGO" == true ]]; then
  echo "💡 nx serve sur la machine : DATABASE_URL=${MONGO_URI_HOST}/bugbountyapp (même base, vue depuis l’hôte)."
elif [[ "$USE_POSTGRES" == true ]]; then
  echo "💡 Préparer DATABASE_URL Postgres côté hôte (psql) vs Docker (host=postgres) selon où tourne le process Node."
else
  echo "💡 Vérifie DATABASE_NAME / Firebase / IN-MEMORY dans .env (pas de base Docker pour ce mode)."
fi
echo ""
echo "🧾 Logs:"
if [[ "$USE_MONGO" == true ]]; then
  echo "   cd \"$PROJECT_DIR\" && ${compose[*]} -f compose.dev.yaml --profile mongodb logs -f"
  echo "   mongosh \"${MONGO_URI_HOST}\""
elif [[ "$USE_POSTGRES" == true ]]; then
  echo "   cd \"$PROJECT_DIR\" && ${compose[*]} -f compose.dev.yaml --profile pg logs -f"
else
  echo "   cd \"$PROJECT_DIR\" && ${compose[*]} -f compose.dev.yaml logs -f"
fi
echo "----------------------------------"

if [[ "${FOLLOW_API_LOGS,,}" == "1" || "${FOLLOW_API_LOGS,,}" == "true" || "${FOLLOW_API_LOGS,,}" == "yes" ]]; then
  echo ""
  info "Following live API logs (Ctrl+C to stop tail, containers keep running)…"
  if [[ "$USE_MONGO" == true || "$USE_POSTGRES" == true ]]; then
    "${compose[@]}" -f "$COMPOSE_BASE" "${PROFILE_ARGS[@]}" logs -f api
  else
    "${compose[@]}" -f "$COMPOSE_BASE" logs -f api
  fi
else
  info "Live API log follow disabled (set API_FOLLOW_LOGS=1 to enable)."
fi
