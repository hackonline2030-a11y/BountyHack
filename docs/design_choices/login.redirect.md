# Choix fait pour la redirection (RBAC & Login)


### Pourquoi pas utiliser proxy.ts ?

Sur une application simple, la documentation de NextJS présente ceci sur `proxy.ts` (middleware): 

```ts
import { NextResponse, NextRequest } from 'next/server'
import { authenticate } from 'auth-provider'
 
export function proxy(request: NextRequest) {
  const isAuthenticated = authenticate(request)
 
  // If the user is authenticated, continue as normal
  if (isAuthenticated) {
    return NextResponse.next()
  }
 
  // Redirect to login page if not authenticated
  return NextResponse.redirect(new URL('/login', request.url))
}
 
export const config = {
  matcher: '/dashboard/:path*',
}
```
Source : [cliquez ici](https://nextjs.org/docs/app/guides/redirecting)

...Mais nous ne passons pas via ce middleware

La redirection à la racine locale dépend du rôle (roleCode via Nest GET users/me), pas seulement de la présence du cookie. Le JWT ne contient pas le rôle. Une règle dans proxy.ts convient surtout au cas simple « pas de session → login » ; chez nous, il faut « session + rôle → tableau de bord ». On garde donc la logique dans un Server Component, alignée avec le DAL existant (verifySession, verifySessionForRoles).



Chemins concernés
Situation	Parcours
Visiteur non connecté
/{lng}/ → /{lng}/login
Déjà connecté sur la page login
/{lng}/login → /{lng}/ → tableau de bord selon le rôle
Après connexion réussie
/{lng}/login → /{lng}/ → tableau de bord selon le rôle
Session invalide ou rôle inconnu
/{lng}/ → /{lng}/login
Page protégée sans session
n’importe quelle route protégée → /{lng}/login (via verifySession)
Tableaux de bord par rôle
Rôle	Destination
SUPER_ADMIN
/{lng}/welcome-admin
HUNTER
/{lng}/welcome-hunter
MENTOR
/{lng}/welcome-mentor
QUALITY_CHECKER
/{lng}/welcome-quality-checker
COORDINATOR
/{lng}/welcome-coordinator
QUALITY_CONTENT
/{lng}/welcome-platform-manager
(lng = en ou fr)

Fichiers impliqués (sans logique dans proxy.ts)
client/app/[lng]/page.tsx — routeur racine (session + rôle → redirection)
client/app/[lng]/login/page.tsx — page de connexion publique
client/lib/dal/session.ts — garde-fous des pages protégées
Passe en mode Agent si tu veux que j’écrive ça directement dans le fichier.

