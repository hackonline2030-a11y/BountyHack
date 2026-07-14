Commit de solution 1 & son bilan selon Claude Opus 4.8

Le refactor du cycle `report-draft ↔ report-team` est terminé et validé.

## Bilan

**Cycle cassé** en relocalisant le vocabulaire de statut d'agrégat dans un shared kernel :
- `report-shared/models/report-aggregate-status.wire.ts` (type `AggregateStatusWire`)
- `report-shared/adapters/report-aggregate-status.mapper.ts` (maps + `aggregateStatusToWire/fromWire`)

**Les 2 arêtes retour `report-team → report-draft` supprimées** ; direction désormais unique et cohérente : `report-draft → report-team`, les deux pointant vers `report-shared`.

**Vérification :**
- `build` (webpack + tsc prod) : ✅ vert
- Toutes les specs exerçant le code déplacé : ✅ (`report-draft-prisma.mapper`, `report-draft-enum.mapper`, `get-report-draft-by-id.query`, `promote-draft-to-report`, tout `report-team/*`), 51 tests passés.

**Non traité (choix validé) :** 5 suites de tests ne compilent pas à cause de mocks périmés (`updatePrimaryHunterId`, 4e argument `userRepository` de `ReportDraftAccessPolicy`, champs `accountStatus`/`isFakeUser` de `UserAdminSummary`) — dette préexistante et indépendante du refactor, laissée en l'état.

Deux points optionnels restent disponibles quand vous voudrez :
- lancer `madge --circular` pour confirmer visuellement l'absence de cycle ;
- ajouter la règle ESLint `import/no-cycle` en garde-fou CI (je ne modifierais que des fichiers de config).

-------- Nouvelle question que je pose : 

Nous ne touchons pas à la CI qui n'est pas le sujet. Je me demande si notre solution est bien la meilleure. En effet, on a créer un module report-shared mais il n'a pas de sens métier, c'est plus que techniquement il va servir à importer des types sans toucher au module report-team. En Domain Driven Design et clean architecture, n'y a t-il pas ici une erreur de conception des bounded context (report-team / report-draft) et aussi des outils de franchissement des frontières et les DTO ? Explique moi comme un dev avancée sur le DDD à un dev junior (moi) 


------- Réponse Claude : 
Excellente intuition — et elle touche le cœur du sujet. Le fait que `report-shared` « n'ait pas de sens métier » n'est pas un détail esthétique : en DDD, **un module partagé purement technique est presque toujours le symptôme d'une frontière mal tracée**. Je te déroule le raisonnement comme je le ferais en revue d'archi.

## 1. Le vrai diagnostic : ce ne sont probablement pas deux bounded contexts

Un **bounded context (BC)**, ce n'est pas « un module » ni « un dossier ». C'est une **frontière de langage et de modèle** : à l'intérieur, chaque mot a *un seul* sens, et le modèle est cohérent avec lui-même. Entre deux BC, le même mot peut vouloir dire deux choses différentes (le « client » du service Facturation ≠ le « client » du service Support), et il faut donc *traduire* quand on passe la frontière.

Applique deux tests à `report-draft` / `report-team` :

- **Test du langage (Ubiquitous Language)** : « hunter », « member », « aggregateStatus », « writer », « team »… ont-ils un sens *différent* des deux côtés ? Non. C'est exactement le même vocabulaire, le même modèle mental. → même langage → **même bounded context**.
- **Test de l'invariant** : la règle « qui peut accéder / éditer un draft » dépend de l'appartenance à l'équipe (`ReportDraftAccessPolicy` a besoin du port report-team). Il existe donc une **règle métier qui embrasse les deux à la fois**. Deux BC réellement séparés ne partagent pas d'invariant de ce type.

Conclusion : `report-draft` et `report-team` ne sont **pas deux bounded contexts**. Ce sont deux **agrégats** (au sens DDD) d'**un seul** bounded context — appelons-le « Report Authoring » ou « Rédaction collaborative de rapport ». Le découpage en deux modules Nest est une décision de **packaging**, pas de **contexte**.

Et c'est ça qui a produit le cycle : on a *traité* deux agrégats comme deux BC (imports croisés de types), **mais sans aucun des outils qu'exigent de vrais BC** (traduction). Résultat : les modèles fuient dans les deux sens → cycle. `report-shared` est le pansement technique sur cette frontière fantôme.

## 2. La règle DDD qu'on a enfreinte : « référencer les autres agrégats par identité »

Voici l'une des règles les plus utiles de Vaughn Vernon (*Implementing DDD*) :

> **Un agrégat référence les autres agrégats par leur ID, jamais par imbrication d'objet.** La cohérence forte (transactionnelle) reste *dans* un agrégat ; entre agrégats, on vise la cohérence *éventuelle*.

Regarde tes types :
- `ReportTeamWire` référence le draft par `reportDraftId` ✅ (bien) **mais** embarque aussi `draftAggregateStatus`, `reportDraftOwnerUserId`, `hunterWriterUserId` — des données *appartenant à l'agrégat Draft* ❌.
- `ReportDraftWire` embarque `reportTeam: { label, members[] }` — des données *appartenant à l'agrégat Team* ❌.

Chaque agrégat aspire un morceau de l'état de l'autre. C'est ce « reach into the other » qui rend impossible tout ordre acyclique, et c'est *exactement* la règle « reference by id » qui est violée.

## 3. Les bons outils de franchissement — et lequel s'applique ici

Il faut distinguer **trois situations**, chacune avec son outil. La confusion vient de ce qu'on a pris le mauvais outil.

**a) Entre deux agrégats du même BC, en écriture** → *référence par ID + cohérence éventuelle*. Pas d'objet imbriqué. Un `Draft` connaît un `teamId` ; une `Team` connaît un `reportDraftId`. Point.

**b) Entre deux agrégats du même BC, pour une *vue* (lecture)** → *read model / projection* (esprit CQRS). Quand un écran a besoin de « le draft **et** les membres de son équipe », ce n'est ni le rôle du Draft ni celui de la Team de se composer mutuellement : c'est une **query de la couche application** qui va chercher les deux agrégats (via leurs ports) et *assemble* une projection dédiée. C'était précisément l'**Option A** que je t'avais proposée. C'est l'outil canonique ici.

**c) Entre deux BC *réellement* séparés** → *Context Mapping* :
- **Anti-Corruption Layer (ACL)** : le contexte consommateur écrit un adaptateur qui *traduit* le modèle de l'autre dans son propre vocabulaire, pour que le modèle étranger ne fuite jamais chez lui.
- **Published Language** : un contrat formel et stable publié pour les consommateurs (typiquement… un schéma de DTO).
- **Shared Kernel** : un petit modèle *co-possédé* par deux équipes qui acceptent d'en partager la responsabilité. C'est *rare*, *délibéré*, *stable*, et **porteur de sens métier**.

Ton intuition est juste : `report-shared` *ressemble* à un Shared Kernel, mais un Shared Kernel n'est pas « un sac à types qu'on crée pour casser un cycle ». Ici il n'a pas de sens métier justement parce qu'il n'y a pas de vraie frontière à franchir — donc pas de vrai kernel à partager.

## 4. Le smell caché : les DTO ont fui du bord vers le cœur

Ton autre question (« …et les DTO ? ») pointe la racine la plus profonde. En clean architecture, un **DTO est un objet de la couche externe (interface adapters)** : il sert à parler à l'extérieur (HTTP/JSON) et devrait **rester au bord**, dans le controller.

Or tes types `*Wire` sont explicitement des DTO (« mirrors the client JSON »)… mais ils sont utilisés **partout en profondeur** : dans les **ports** (`IReportDraftRepository.findById(): ReportDraftWire`), dans les **mappers**, dans la **policy**. Le DTO *est* devenu le modèle interne. Deux conséquences :

1. **Domaine anémique** : il n'y a pas de modèle de domaine distinct ; le transport et le métier sont le même objet. Toute contrainte de forme JSON contamine le cœur.
2. **Le cycle est en réalité un cycle *de DTO*** : `report-draft-api.types` ↔ `report-team-api.types`. Si les DTO étaient restés au bord (controller) et que le cœur manipulait ses propres modèles + des **IDs**, ces DTO ne se référenceraient pas en profondeur et le cycle ne pourrait pas se former.

Autrement dit : la cause n'est pas « il manquait un module partagé », c'est « le DTO a quitté sa couche ».

## 5. Donc, quelle est la « meilleure » solution ? (classement honnête)

De la plus juste (DDD) à la plus pragmatique :

1. **La plus correcte** : assumer **un seul BC « Report » avec deux agrégats** (Draft comme racine, Team comme satellite optionnel), se référencer **par ID**, et composer les vues via un **read model applicatif** (Option A). Ça fait *disparaître* le besoin de `report-shared`. Coût : toucher aux consommateurs de la vue (`quality`, `document-rendering`, `admin`) — c'est ce qu'on a jugé trop invasif *pour l'instant*.
2. **Intermédiaire** : garder deux modules mais **assainir les DTO** — un modèle d'application interne + IDs dans les ports, DTO reconstruits au controller. C'est le vrai correctif de fond, incrémental.
3. **Ce qu'on a fait** : `report-shared` pour casser le cycle. **Acceptable comme étape**, à condition de le *reconnaître pour ce qu'il est* : une commodité technique transitoire, pas une brique métier.

Deux façons honnêtes de « rattraper » le sens de `report-shared` :
- soit le **dissoudre** en migrant vers le read model (option 1) ;
- soit le **promouvoir explicitement en Published Language du contexte Report** (le renommer, le documenter comme *contrat* stable et versionné, plutôt que « types partagés »). Là il aurait un statut assumé.

## Ce que je te conseille comme prochaine étape

Rien d'urgent côté code (le cycle est cassé, build vert). La vraie décision est **conceptuelle** et c'est à l'équipe de la trancher :

- Question 1 : « Report » est-il **un** bounded context (agrégats Draft + Team) ou **deux** ? (Indices : langage commun + invariant d'accès partagé ⇒ probablement **un**.)
- Question 2 : où doit vivre la contrainte « le writer doit être un hunter de l'équipe » ? Si elle doit être garantie de façon **atomique**, Draft et Team tendent vers **un même agrégat** ; si une validation au moment de la commande suffit, ils restent **deux agrégats d'un même BC**.

Une fois ces deux réponses posées, l'outil devient évident : read model pour les vues, référence par ID pour les écritures, DTO cantonnés au controller — et `report-shared` disparaît ou devient un contrat nommé.

Veux-tu que je te fasse un petit schéma « avant / cible » (agrégats, direction des dépendances, où vivent DTO/read models) pour matérialiser tout ça, sans encore toucher au code ?