# API HTTP

L’**OpenAPI (Swagger UI)** est exposée à `{origine}/api/docs` (préfixe `GLOBAL_PREFIX`, par défaut `api`).

- **nx serve** sur l’hôte : en général `http://localhost:3000/api/docs` (selon `PORT` dans `.env`).
- **Docker** (`./docker/start.sh watch-up`) : par défaut `http://localhost:3003/api/docs` (variable `API_HOST_PORT`).

Les routes couvrent notamment l’**auth** (JWT / Firebase), les **users** et le **ping** de santé.

La validation d’entrée repose sur le **`ValidationPipe` global** et les DTO (voir [validation-system.md](./validation-system.md)).
