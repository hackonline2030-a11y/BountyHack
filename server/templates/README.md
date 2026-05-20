# Templates

Server-side assets for report rendering (EJS, styles) and **private** draft image storage. Not served as static files from the web root.

## Layout

| Path | Purpose |
|------|---------|
| `report-final/index.ejs` | PDF/HTML report template |
| `report-final/styles/` | Template CSS |
| `report-final/assets/uploads/report-drafts/{draftId}/{stepKey}/{attachmentId}.{ext}` | Private images uploaded from the report-draft wizard |

Paths are resolved from the API process `cwd` (`server/`), e.g.  
`templates/report-final/assets/uploads/report-drafts/...`

## Security model

### Application (primary)

- **Upload:** `POST /api/report-drafts/draft/:draftId/attachments/images` — requires auth and `assertCanSaveDraft` (designated hunter writer only).
- **Read:** `GET /api/report-drafts/draft/:draftId/attachments/:attachmentId/image` — requires auth and `assertCanReadDraft` (report team / workflow access).
- Images are **not** exposed under `client/public/` or a public URL path.

### Filesystem (defense in depth)

On successful upload, the API creates:

- Directories: `0o700` (`drwx------`)
- Files: `0o600` (`-rw-------`)
- Owner: user running PM2 API (typically `deploy`)

Only the Nest process needs read/write. Do **not** chmod uploads to `644`/`755` to “help nginx read” — nginx must not read these files.

Optional hardening on the VPS: parent `templates/report-final` may be `750` (`deploy:deploy`); leave `assets/uploads/...` to the app defaults (`700`/`600`).

### Nginx / VPS

- **Do not** set `root` or `alias` on `~/bugbountyapp/server` or `templates/`. Use `proxy_pass` only to `127.0.0.1:3000` (API) and `3001` (Next).
- Browser upload hits `https://hackthebounty.fr/api/report-draft/...` (Next BFF), then the API. Set **`client_max_body_size`** ≥ **12M** on both front and API vhosts (app limit: **10 MB**). Only **one** `client_max_body_size` per `server` block — duplicates make `nginx -t` fail and the old config stays loaded.
- A **413** on upload with empty PM2 logs usually means nginx rejected the body before Node ran.

### What must not happen

| Misconfiguration | Risk |
|------------------|------|
| nginx static `root` on `server/` or `templates/` | Public GET of upload files; POST may never reach Nest |
| World-readable upload files (`644`) | Local or HTTP leakage if static serving is added later |
| Relying on obscurity of file paths | Paths are predictable; auth must stay on API routes |

## Operations

```bash
# After a successful upload (API cwd = server/)
ls -la templates/report-final/assets/uploads/report-drafts/

# Verify PM2 cwd
pm2 describe api | grep -i cwd

# Writable by deploy (smoke test)
mkdir -p templates/report-final/assets
touch templates/report-final/assets/.write-test && rm templates/report-final/assets/.write-test