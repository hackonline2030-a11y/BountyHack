# Architecture decision records — Next.js client (`bugbountyapp/client`)

## Summary

- **Bounded modules under `modules/`**: feature logic (e.g. `modules/auth/core`) stays independent of the App Router; `app/` remains a thin delivery layer (pages, Route Handlers, layouts).
- **Ports vs adapters**: `modules/auth/core/gateway/` holds **ports** (interfaces only). `gateway-infra/` holds **adapters** that depend on concrete stacks (HTTP, crypto libraries, framework APIs).
- **DAL at the edge**: Server Component protection uses a small DAL (`lib/dal/session.ts`) that delegates to auth use cases, following [Next.js authentication guidance](https://nextjs.org/docs/app/guides/authentication) (centralized check, `cache()`).
- **JWT verification library**: access tokens issued by Nest are verified on the Next server with **`jose`** behind an explicit adapter name (`JoseJwtHs256AccessTokenVerifier`) so the implementation is obvious in code review and search.

---

## ADR: `IAppHostSessionGateway` implemented in `gateway-infra` with `next/headers`

### Context

We need to persist an **httpOnly cookie** on the **Next origin** so Server Components can tell whether a user has a valid app-session signal, while keeping **Nest** as the authority for credentials and tokens and avoiding **Next-specific APIs** inside the application core.

Cookie read/write in the App Router is done via **`cookies()` from `next/headers`**, which is only valid in server contexts (Route Handlers, Server Components, Server Actions).

The client auth module uses a **layered layout** inspired by **ports and adapters** (hexagonal / clean architecture):

- **`gateway/`** = outbound **ports** (contracts the use cases depend on).
- **`gateway-infra/`** = **adapters** that implement those ports using real I/O and third-party or framework APIs.

### Decision

Implement **`NextCookiesAppHostSessionGateway`** in **`modules/auth/core/gateway-infra/next-cookies-app-host-session.gateway-infra.ts`**, depending on **`next/headers`**.

The port **`IAppHostSessionGateway`** in **`gateway/`** remains a plain TypeScript interface with **no** import from Next.

### Consequences

**Positive**

- **Ports stay framework-agnostic**: the use cases (`establish-app-session`, `require-app-session`) only depend on `IAppHostSessionGateway` and `IAccessTokenVerifier`. They can be tested with in-memory stubs without loading Next.
- **Single place for “Next knows about cookies”**: all `cookies()` usage for this session is isolated in one adapter alongside other infrastructure, so cookie policy (name, path, flags) does not leak into use cases.
- **Replaceable delivery**: if we later read the same contract from another mechanism (e.g. BFF proxy, different cookie API), we add another `gateway-infra` implementation and change the factory — not the use cases.

**Negative / tradeoffs**

- **`gateway-infra` is not “pure” domain**: this folder intentionally allows **framework and environment** dependencies. Readers must treat **`gateway/`** as the dependency direction boundary: **nothing in `gateway/` may import `next/*`**.
- **Tests for the concrete adapter** require Next test doubles or integration-style tests if we assert cookie attributes end-to-end; unit tests remain focused on use cases + stub gateways (as today).

### Alternatives considered

1. **`cookies()` inside use cases or Route Handlers only** — Rejected: would scatter framework calls and blur application vs infrastructure, making reuse and testing harder.
2. **Move the port into `app/`** — Rejected: the port describes **app-host session persistence**, which is an application concern; only the **implementation** is Next-specific.
3. **Abstract `cookies()` behind a narrower “cookie store” port** — Deferred: possible if multiple cookie names or layouts appear; until then `IAppHostSessionGateway` is already a focused port.

### Status

Accepted — **session cookie adapters** live in **`gateway-infra`** next to other stack-specific code; **ports** stay in **`gateway/`** with no `next/*` imports.
