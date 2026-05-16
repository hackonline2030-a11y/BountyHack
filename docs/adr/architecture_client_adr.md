# Architecture Decision Records — client Next.js (`bugbountyapp/client`)

## Synthèse

- **Modules délimités sous `modules/`** : la logique métier (ex. `modules/auth/core`) reste indépendante de l’App Router ; `app/` n’est qu’une couche de livraison fine (pages, Route Handlers, layouts).
- **Ports vs adapters** : `modules/auth/core/gateway/` héberge les **ports** (uniquement des interfaces). `gateway-infra/` héberge les **adapters** qui dépendent de stacks concrètes (HTTP, librairies crypto, APIs framework).
- **DAL à la lisière** : la protection des Server Components passe par un petit DAL (`lib/dal/session.ts`) qui délègue aux use cases d’auth, en suivant la [recommandation Next.js sur l’authentification](https://nextjs.org/docs/app/guides/authentication) (vérification centralisée, `cache()`).
- **Librairie de vérification JWT** : les jetons d’accès émis par Nest sont vérifiés sur le serveur Next via **`jose`** derrière un adapter au nom explicite (`JoseJwtHs256AccessTokenVerifier`), pour que l’implémentation soit évidente à la revue de code et à la recherche.

---

## ADR : `IAppHostSessionGateway` implémenté en `gateway-infra` avec `next/headers`

### Contexte

On doit persister un **cookie httpOnly** sur l’**origine Next** pour que les Server Components puissent déterminer si l’utilisateur dispose d’un signal de session app valide, tout en gardant **Nest** comme autorité sur les credentials et les jetons, et en évitant les **APIs spécifiques à Next** à l’intérieur du cœur applicatif.

La lecture/écriture de cookies dans l’App Router passe par **`cookies()` de `next/headers`**, qui n’est valide que dans des contextes serveur (Route Handlers, Server Components, Server Actions).

Le module auth côté client utilise une **organisation en couches** inspirée de **ports and adapters** (architecture hexagonale / clean architecture) :

- **`gateway/`** = **ports** sortants (contrats dont dépendent les use cases).
- **`gateway-infra/`** = **adapters** qui implémentent ces ports en s’appuyant sur de l’I/O réel et des APIs tierces ou framework.

### Décision

Implémenter **`NextCookiesAppHostSessionGateway`** dans **`modules/auth/core/gateway-infra/next-cookies-app-host-session.gateway-infra.ts`**, en dépendant de **`next/headers`**.

Le port **`IAppHostSessionGateway`** sous `gateway/` reste une simple interface TypeScript, **sans aucun** import depuis Next.

### Conséquences

**Positifs**

- **Les ports restent framework-agnostic** : les use cases (`establish-app-session`, `require-app-session`) ne dépendent que de `IAppHostSessionGateway` et `IAccessTokenVerifier`. Ils sont testables avec des stubs in-memory sans charger Next.
- **Un seul endroit où « Next sait gérer les cookies »** : tout l’usage de `cookies()` pour cette session est isolé dans un unique adapter à côté du reste de l’infrastructure, de sorte que la politique de cookie (nom, path, flags) ne fuite pas dans les use cases.
- **Livraison remplaçable** : si on relit demain le même contrat via un autre mécanisme (par ex. proxy BFF, autre API de cookies), on ajoute une autre implémentation `gateway-infra` et on change la factory — pas les use cases.

**Négatifs / compromis**

- **`gateway-infra` n’est pas du « pur » domaine** : ce dossier autorise volontairement des dépendances **framework et environnement**. Les lecteurs doivent traiter **`gateway/`** comme la frontière du sens de dépendance : **rien dans `gateway/` ne peut importer `next/*`**.
- **Tester l’adapter concret** demande des doubles de test Next, voire des tests d’intégration si on veut valider les attributs cookie de bout en bout ; les tests unitaires restent concentrés sur use cases + stub gateways (comme aujourd’hui).

### Alternatives envisagées

1. **Appeler `cookies()` directement dans les use cases ou seulement dans les Route Handlers** — Rejeté : disperserait les appels framework et flouterait la frontière application / infrastructure, rendant la réutilisation et les tests plus difficiles.
2. **Déplacer le port dans `app/`** — Rejeté : le port décrit la **persistance de session côté app-host**, qui est une préoccupation applicative ; seule l’**implémentation** est spécifique à Next.
3. **Abstraire `cookies()` derrière un port « cookie store » plus étroit** — Différé : envisageable si plusieurs noms ou layouts de cookies apparaissent ; jusque-là, `IAppHostSessionGateway` est déjà un port suffisamment ciblé.

### Statut

Accepted — les **adapters cookie de session** vivent dans **`gateway-infra`** à côté du reste du code spécifique à la stack ; les **ports** restent dans **`gateway/`** sans aucun import `next/*`.

---

## ADR : différer l’ouverture d’un bounded context `profile`

### Contexte

Le code client expose aujourd’hui trois formes de modules côte à côte :

- **`modules/auth/core/`** — découpage hexagonal complet (`model/`, `gateway/`, `gateway-infra/`, `usecase/`, `*.factory.ts`) pour la session, la vérification JWT, le TOTP et le password reset.
- **`modules/admin/core/`** — le même découpage pour la surface admin de gestion des utilisateurs (listing `GET /api/users` aujourd’hui, mutations à venir).
- **`lib/dal/welcome-user.ts`** et **`lib/dal/parameters-profile.ts`** — helpers DAL plats qui font un `fetch` sur Nest **`GET /api/users/me`** et exposent les données d’affichage (`username`, `twoFactorEnabled`) de l’utilisateur courant, sans règle de parsing propre.

Par symétrie visuelle, les lectures côté profil dans `lib/dal/` pourraient être promues dans un bounded context **`profile`** miroir de `auth/core` et `admin/core` (port, adapter, use case, factory, tests). La question est de savoir si ce déplacement est justifié **aujourd’hui**.

### Décision

**Ne pas ouvrir de bounded context `modules/profile/core/` pour le moment.** Garder les lectures profil sous forme de helpers DAL plats dans `lib/dal/` jusqu’à apparition d’un signal déclencheur (voir *Déclencheurs* ci-dessous). La décision applique les heuristiques DDD de bounded context au code **actuel** plutôt qu’au code futur imaginé par symétrie.

| Critère | `auth` | `admin` | `profile` (aujourd’hui) |
|---|---|---|---|
| Vocabulaire ubiquitaire distinct | Oui (`session`, `credentials`, `token`, `step-up`) | Oui (`supervision`, `directory`, `assignable role`) | Non — même `User` qu’`auth` |
| Invariants propres | Oui (validité de session, step-up TOTP, unicité d’un reset) | Futur (last-admin, mutation de son propre rôle) | Aucun aujourd’hui |
| Mutations à l’horizon | n/a (déjà mature) | Oui (`updateRole`, `deleteUser`) | Aucune planifiée |
| Nombre d’opérations | nombreuses | en croissance | 2 lectures simples sur le même endpoint |

`profile` échoue sur chaque colonne. Échafauder la structure hexagonale complète (≈ 6 fichiers) pour un seul getter serait du **YAGNI** — le coût architectural dépasse le bénéfice et calcifierait une forme de port qu’aucun call site réel ne vient valider.

### Déclencheurs pour ouvrir le contexte

Ouvrir `modules/profile/core/` dès qu’**au moins l’un** des signaux suivants apparaît dans une PR :

- La première **mutation** sur l’utilisateur courant (`PATCH /api/users/me/...`, `POST /api/users/me/avatar`, etc.). Une mutation amène toujours de la validation d’entrée, du mapping d’erreur, des préoccupations d’optimistic-update ou de refresh, et au moins un invariant qui mérite d’être isolé hors de la page.
- Un **invariant domaine côté client** sur les données de profil (par ex. *« le display name doit matcher `^[a-z0-9_-]{3,32}$` »*, *« changer d’email verrouille le compte dans un état `pending_verification` jusqu’au clic sur le lien »*). Même une fonctionnalité en lecture seule mérite d’être promue dès lors que l’*interprétation* de la réponse porte des règles de domaine au lieu d’un simple passthrough des champs.
- Un **troisième** lecteur plat sur `users/me` avec une projection significativement différente. Deux lecteurs peuvent cohabiter comme helpers DAL ; le troisième est le signal qui dit *« on a une couche view-model qui veut exister »*.

La PR déclencheuse rapatrie également les `welcome-user.ts` / `parameters-profile.ts` existants dans le nouveau module pour la cohérence locale — pas avant. La forme du port et les types de résultat se décident alors **avec au moins une mutation en main** et un invariant de parsing à encoder, c’est-à-dire au moment où un contrat utile émerge réellement.

### Conséquences

**Positifs**

- **L’échafaudage correspond à la densité** : la profondeur de chaque module reflète la complexité de domaine qu’il porte vraiment, pas un besoin de symétrie visuelle entre les modules.
- **Liaison tardive du contrat** : les formes de port et de use case sont conçues quand ≥ 2 opérations réelles forcent un contrat sensé, pas quand une seule lecture existe.
- **Annulation peu coûteuse** : si le produit ne fait jamais grandir les mutations de profil (peu probable mais possible), aucun échafaudage mort ne survit.

**Négatifs / compromis**

- **Asymétrie visible** : un lecteur du code voit `auth/core` et `admin/core` pleinement structurés à côté d’un `lib/dal/welcome-user.ts` plat. Un reviewer qui ne connaît pas cette ADR peut proposer un *refactor de cohérence* que ce document rejette explicitement — pointer vers cette ADR dans ce genre de discussions.
- **Coût de migration ponctuel le jour du déclencheur** : déplacer les fichiers, mettre à jour les imports, écrire des tests. Ce coût est borné et justifié par la nouvelle opération ; le payer maintenant reviendrait à le payer de manière spéculative contre une forme inconnue.

### Alternatives envisagées

1. **Ouvrir `modules/profile/core/` dès maintenant pour la symétrie** — Rejeté. Crée ≈ 6 fichiers (model, gateway, gateway-infra, usecase, factory, test) pour deux getters sans logique de parsing ni invariants. La symétrie n’est pas un objectif ; **faire correspondre la forme du module à sa complexité**, oui.

2. **Replier les lectures profil dans `modules/auth/core/`** — Rejeté. `auth` possède les *attributs d’identité utilisés par la couche d’autorisation* (`uid`, `email`, `roleCode`). Les attributs d’affichage (`username`, futur avatar, préférences) appartiennent ailleurs, par le **vocabulaire** (affichage vs identité) et par le **cycle de vie** (éditer son profil n’invalide pas les sessions). Les replier dans auth étendrait auth au-delà de sa frontière actuellement bien définie.

3. **Renommer `lib/dal/welcome-user.ts` → `lib/dal/profile-user.ts` dès aujourd’hui** — Différé. Le renommage signalerait l’emplacement futur sans payer le coût de l’échafaudage. C’est un geste cosmétique, à appliquer opportunément (par ex. quand le fichier est édité pour une autre raison), pas comme un refactor à part entière.

4. **Abstraire un `IUserMeGateway` générique partagé entre `auth`, `admin` et un futur `profile`** — Rejeté. Les trois contextes lisent le même endpoint Nest, mais avec un RBAC, des projections et des consommateurs différents. Un port partagé prématuré les coupletait autour d’un endpoint incidentel, pas autour d’un vrai concept partagé ; le jour où l’un d’eux a besoin d’un verbe ou d’une surface différents, le port partagé devient l’obstacle.

### Statut

Deferred — À réévaluer lors de la première PR qui introduit soit un endpoint `PATCH /api/users/me/...` côté Nest, soit un invariant de profil côté client, soit un troisième lecteur significativement différent sur `users/me`. À ce moment-là, cette ADR passe en Superseded et une ADR suivante documente l’ouverture effective du contexte avec les opérations concrètes qui l’ont justifiée.
