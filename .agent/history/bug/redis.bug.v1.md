## Redis PM2 corrigé

### Problème
PM2 lançait Redis avec un mauvais chemin :
- **Avant :** `/home/deploy/redis-pm2.conf` (inexistant)
- **Après :** `/home/deploy/docs/redis-pm2.conf`

D’où ~26 millions de redémarrages et des connexions orphelines.

### Ce qui a été fait
1. Suppression et recréation du processus `redis` avec le bon chemin
2. **`pm2 save`** — configuration persistée dans `~/.pm2/dump.pm2`
3. **`ecosystem.config.example.cjs`** — entrée `redis` ajoutée pour les prochains déploiements
4. Redémarrage de **`api`** pour reconnecter proprement à Redis

### État actuel

| Processus | Statut | Restarts |
|-----------|--------|----------|
| `redis` | online | 1 (redémarrage volontaire) |
| `api` | online | — |
| `next-app` | online | — |
| `redis-cli ping` | **PONG** | — |

Les ~23k connexions en `FIN-WAIT-2` sont des restes du crash loop — elles vont expirer seules en quelques minutes. Redis répond normalement.

### Pour un futur `pm2 start` complet
```bash
cd ~/bugbountyapp
cp ecosystem.config.example.cjs ecosystem.config.cjs   # si pas encore fait
pm2 start ecosystem.config.cjs
pm2 save
```