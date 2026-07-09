---
name: clean-architecture
description: >-
  Clean Architecture, DDD, and Hexagonal (Ports & Adapters) patterns for the
  BountyHack NestJS API. Use when structuring server/src modules, placing logic
  across layers, adding commands/queries/ports/adapters, or deciding when to
  introduce richer domain models. Includes BountyHack conventions (primary) and
  generic NestJS reference examples (appendix).
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
source: "Adapted for bugbountyapp/server; generic examples retained as reference"
---

# Clean Architecture — BountyHack server (NestJS)

This skill has **two parts**:

1. **Part A (primary)** — how **this repo** implements clean / hexagonal architecture under `server/src/`
2. **Part B (appendix)** — generic NestJS clean architecture patterns (textbook examples you may evolve toward)

**Always follow Part A first** when working on BountyHack. Use Part B when a feature genuinely needs richer DDD (value objects, aggregates, domain events) that the project does not have yet.

Project references:
- [`server/Agents.md`](../../server/Agents.md)
- [`docs/adr/architecture_server_adr.md`](../../docs/adr/architecture_server_adr.md)
- [`server/src/auth/README.md`](../../server/src/auth/README.md)
- Related skill: [`.agent/cleancode/SKILL.md`](../cleancode/SKILL.md)

---

## When to Use

- Adding or refactoring a server module (`auth`, `users`, `quality`, `report-draft`, …)
- Unsure whether logic belongs in domain, application, adapter, or controller
- Designing a new port + Prisma adapter
- Reviewing dependency direction or module wiring
- Deciding if a generic DDD pattern (aggregate, value object, domain event) is worth introducing

---

# Part A — BountyHack server architecture (follow this)

## A.1 Philosophy: lightweight clean architecture

BountyHack uses **feature-first clean architecture** (Screaming Architecture):

- Each **bounded context** is a top-level folder under `server/src/` (`auth/`, `users/`, `quality/`, …)
- Layers live **inside the feature**, not in global `domain/` / `application/` / `infrastructure/` folders
- **Thin domain by default** — rich DDD only when business invariants justify it (see ADR)
- **Pragmatism over purity** — small cross-module imports are allowed when documented (e.g. `users` → `auth` ports)

Active development target: **`DATABASE_NAME=MYSQL_PRISMA`** — implement and test MySQL Prisma adapters under `adapters/postgre-prisma/` (historical folder name). Do not extend Mongo/Postgres adapters unless explicitly requested.

## A.2 Top-level `server/src/` layout

```
server/src/
├── auth/                 # JWT, refresh tokens, password reset, TOTP, RBAC
├── users/                # Profiles, admin listing, account lifecycle
├── quality/              # Quality criteria, distributions, checks
├── report-draft/         # Report drafts, submissions, reviewer comments
├── report-team/          # Report team membership
├── document-rendering/   # PDF / HTML generation (Puppeteer, BullMQ)
├── ping/                 # Health / version
├── core/                 # AppModule, Prisma module, rate limiting, shared HTTP DTO helpers
├── shared/               # Cross-cutting utils (database-mode, executable, RBAC enums)
├── generated/prisma/     # Generated Prisma client (infrastructure)
└── test/mocks/           # Jest stubs (e.g. Prisma client redirect)
```

## A.3 Feature module anatomy (real examples)

### Full layering — `auth/`

```
auth/
├── domain/models/identity.ts              # Thin: uid, email, optional roleCode
├── ports/                                 # auth.repository.ts, refresh-token.repository.ts, …
├── application/
│   ├── commands/                          # register-with-password.command.ts, …
│   ├── queries/                           # get-refresh-access-token.query.ts, …
│   ├── models/                            # RegisterWithPasswordInput, AuthenticatedSession
│   └── services/                          # issue-password-setup-token.service.ts
├── adapters/
│   ├── passport-jwt/                      # strategies, guards, JWT repo facade
│   ├── postgre/                           # prisma-password-reset.repository.ts
│   ├── postgre-prisma/                    # (in other modules) MySQL Prisma repos
│   ├── transactional-mail/                # smtp, mailgun, brevo, console
│   └── http/                              # map-jwt-register-body.ts, jwt-refresh-cookie.ts
├── controllers/                           # passport-jwt-auth.controller.ts, …
├── dto/                                   # jwt-auth.dto.ts (HTTP + OpenAPI only)
├── rbac/                                  # roles.guard.ts, @AuthRoles
├── config/auth-env.ts
└── auth.module.ts
```

### Flatter application — `users/`

```
users/
├── models/                                # user-record.model.ts, user-admin-summary.model.ts
├── ports/user-repository.interface.ts     # I_USER_REPOSITORY symbol
├── commands/                              # update-own-profile.command.ts (no application/ subfolder)
├── queries/                               # list-users-admin-summaries.query.ts
├── payloads/                              # update-own-profile.payload.ts
├── adapters/postgre-prisma/               # prisma-user-repository.ts
├── controllers/users.controller.ts
├── dto/user.dto.ts, profile.dto.ts
└── user.module.ts
```

Both styles are valid. Prefer **`application/`** subfolder when the module grows; flat `commands/` / `queries/` is fine for smaller modules.

## A.4 Layer mapping and request flow

**Dependency flow (inward):**

```text
controllers/  →  commands/ | queries/  →  ports/  ←  adapters/
     ↓                    ↓
   dto/              models/ | application/models/ | payloads/
```

**Real pipeline — `POST /api/auth/register`:**

```text
PassportJwtAuthController
  → toRegisterWithPasswordInput(body)     [adapters/http/map-jwt-register-body.ts]
  → RegisterWithPasswordCommand.execute() [application/commands]
  → AuthRepository                        [port]
  → PassportJwtAuthRepository             [adapter facade]
  → PostgrePrismaPassportJwtRepository     [adapters/.../postgre-prisma, MYSQL_PRISMA]
```

## A.5 Dependency rules (non-negotiable)

| Layer | May import | Must NOT import |
|-------|------------|-----------------|
| **Controller** | commands, queries, DTOs, HTTP mappers, guards, core DTO helpers | Prisma, concrete adapters, `generated/prisma` |
| **Command / Query** | ports, models, policies, other ports (pragmatic) | controllers, Prisma, concrete adapters |
| **Port** | domain / application types | adapters, HTTP DTOs with `@ApiProperty` |
| **Adapter** | port implemented, `PrismaService`, mappers, utils | controllers |
| **Domain / models** | shared enums (`AppRoleCode`) | infrastructure, Nest decorators (prefer plain TS) |

**DI wiring** in `*.module.ts`:

```typescript
{ provide: I_USER_REPOSITORY, useClass: PrismaUserRepository }
```

**Module registration** uses `DATABASE_NAME` / `isPrismaSqlMode()` — only wire adapters and controllers valid for the current mode. Unsupported adapters throw `NotImplementedException`, not silent empty results.

## A.6 HTTP vs application vs domain (ADR)

| Concern | Location | Example |
|---------|----------|---------|
| HTTP contract (validation, Swagger) | `dto/` | `JwtLoginRequestDto` |
| Use case input/output | `application/models/`, `payloads/` | `RegisterWithPasswordInput`, `AuthenticatedSession` |
| Post-auth principal (minimal) | `domain/models/` | `Identity` (`uid`, `email`) |
| Read projections | `models/` | `UserRecord` (self) vs `UserAdminSummary` (admin table) |
| HTTP mapping | `adapters/http/` | `toRegisterWithPasswordInput()` |

**Rules:**
- Do **not** duplicate the same shape in `dto/` and `application/` without explicit mapping at the controller
- Do **not** put `@ApiProperty` on ports
- Enrich `domain/` only when a **reusable business invariant** exists — not to mirror DB columns

## A.7 Naming conventions (this repo)

| Artifact | Pattern | Example |
|----------|---------|---------|
| Command | `{verb}-{noun}.command.ts` | `register-with-password.command.ts` |
| Query | `{verb}-{noun}.query.ts` | `list-users-admin-summaries.query.ts` |
| Port | `{name}.repository.ts` or `{name}-repository.interface.ts` | `I_USER_REPOSITORY` |
| Prisma adapter | `prisma-{feature}.repository.ts` | `prisma-user-repository.ts` |
| Mapper | `{feature}-prisma.mapper.ts` | `quality-prisma.mapper.ts` |
| HTTP DTO | `{feature}.dto.ts` | `jwt-auth.dto.ts` |
| Application input | `{action}.input.ts` / `.payload.ts` | `login-with-password.input.ts` |
| Read model | `{name}.model.ts` | `user-admin-summary.model.ts` |
| Access policy | `{feature}-access.policy.ts` | `report-draft-access.policy.ts` |
| Test | co-located `*.spec.ts` | `update-own-profile.command.spec.ts` |

Commands/queries may implement `Executable<Request, Response>` from `shared/executable.ts`.

## A.8 Where to put new code (decision tree)

```
New behavior needed?
├── JSON contract / validation / OpenAPI?     → dto/ + controller
├── Orchestration of ports?                   → command/ or query/
├── Persistence contract?                       → ports/
├── Prisma / mail / JWT / external API?       → adapters/
├── Reusable business invariant?              → domain/models/ (rare — justify in ADR)
├── Authorization rule for a feature?         → *-access.policy.ts or rbac/
└── Env / TTL / URL config?                   → config/ or adapters/utils/
```

## A.9 Cross-cutting patterns in this repo

- **RBAC at HTTP boundary**: `@AuthRoles(AppRoleCode.SUPER_ADMIN)` — not URL-prefix security
- **Separate read models** when consumers differ (ADR: `UserRecord` vs `UserAdminSummary`)
- **Access policies**: `quality-access.policy.ts`, `report-draft-access.policy.ts`
- **Pragmatic cross-module deps**: e.g. `UpdateOwnProfileCommand` injects `auth` refresh-token port and step-up service — keep minimal and documented
- **Opaque refresh tokens**: hash SHA-256 in DB, rotation on refresh (see `auth/README.md`)

## A.10 Testing

| Type | Location | Pattern |
|------|----------|---------|
| Unit | co-located `*.spec.ts` | Mock ports: `jest.Mocked<Pick<IUserRepository, 'updateOwnProfile'>>` |
| Controller | `*.controller.spec.ts` | Mock commands/queries |
| Adapter / mapper | `*.spec.ts` next to adapter | Prisma mocked or mapper pure logic |
| E2E | `server/e2e/src/server/` | supertest against running API |

Domain/application tests often need **no Nest testing module** — instantiate command with mocked ports directly.

## A.11 When to introduce richer DDD (from generic patterns)

The project **does not require** value objects, aggregates, or domain events by default. Consider them when:

| Pattern | Introduce when… | Example in this codebase |
|---------|-----------------|--------------------------|
| **Value Object** | invariant + reuse across modules (email, money, token TTL rules as types) | Not used yet — candidates: sealed token types |
| **Aggregate Root** | multi-entity consistency boundary with invariants | Not default — report-draft lifecycle may qualify later |
| **Domain Event** | other bounded contexts must react to state changes async | Not used yet — PDF job completion could qualify |
| **Domain Service** | logic spans entities without fitting one command | `issue-password-setup-token.service.ts` (application service today) |

Default for CRUD or simple workflows: **models + command + port + Prisma adapter**.

## A.12 Adding a new feature (checklist)

1. Create or extend a bounded context folder under `server/src/<feature>/`
2. Define port(s) in `ports/`
3. Implement command/query in `application/` or flat `commands/` / `queries/`
4. Add Prisma adapter under `adapters/postgre-prisma/` (MySQL)
5. Add HTTP DTOs in `dto/` + mapper in `adapters/http/` if needed
6. Thin controller — delegate to command/query
7. Wire in `<feature>.module.ts` with `provide` / `useClass`
8. Co-located unit test for command/query
9. Update ADR if the decision is non-obvious

## A.13 Enable this skill

| Tool | Action |
|------|--------|
| **Cursor** | `cp -r .agent/architecture .cursor/skills/clean-architecture` |
| **Claude** | Import this `SKILL.md` into project instructions |

---

# Part B — Generic Clean Architecture reference (textbook examples)

> **Note:** These examples illustrate classic layer-first clean architecture with TypeORM.
> BountyHack uses **feature-first folders + Prisma** (Part A). Use Part B as a **reference**
> when evolving toward richer domain models — do not restructure the repo to match this layout.

## B.1 Architectural layers (generic)

Clean Architecture organizes code into concentric layers where dependencies flow inward:

```
+-------------------------------------+
|  Infrastructure (Frameworks, DB)    |  Outer layer - volatile
+-------------------------------------+
|  Adapters (Controllers, Repositories)|  Interface adapters
+-------------------------------------+
|  Application (Use Cases)            |  Business rules
+-------------------------------------+
|  Domain (Entities, Value Objects)   |  Core - most stable
+-------------------------------------+
```

Hexagonal Architecture (Ports & Adapters):
- **Ports**: interfaces defining what the application needs
- **Adapters**: concrete implementations of ports
- **Domain core**: pure business logic with zero framework dependencies

## B.2 DDD tactical patterns (generic)

- **Entities**: objects with identity and lifecycle
- **Value Objects**: immutable, defined by attributes
- **Aggregates**: consistency boundaries with aggregate roots
- **Domain Events**: capture state changes
- **Repositories**: abstract data access for aggregates

## B.3 Generic layer-first project structure

```
src/
+-- domain/                    # Inner layer - no external deps
|   +-- entities/
|   +-- value-objects/
|   +-- aggregates/
|   +-- events/
|   +-- repositories/          # Repository interfaces (ports)
|   +-- services/
+-- application/
|   +-- use-cases/
|   +-- ports/
|   +-- dto/
|   +-- services/
+-- infrastructure/
|   +-- database/
|   +-- http/
|   +-- messaging/
+-- adapters/
    +-- http/                  # Controllers
    +-- persistence/           # Repository implementations
    +-- external/
```

**BountyHack equivalent:** layers are **inside each feature folder** (Part A), not at `src/` root.

## B.4 Generic implementation steps

1. **Domain**: value objects, entities, aggregates, repository port interfaces
2. **Application**: use cases with `execute()`, inject ports, single responsibility
3. **Adapters**: persistence (ORM mapping), HTTP (controllers), external services
4. **DI**: register use cases; `provide: TOKEN, useClass: Adapter`
5. **Best practices**: dependency rule, rich domain when justified, immutability for VOs, validate at boundaries, transactions in application layer

## B.5 Generic examples

### Example 1: Value Objects

```typescript
// domain/value-objects/email.vo.ts
export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!this.isValid(email)) {
      throw new Error('Invalid email format');
    }
    return new Email(email.toLowerCase().trim());
  }

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

### Example 2: Entity with business logic

```typescript
// domain/entities/order-item.entity.ts
export class OrderItem {
  constructor(
    private readonly productId: string,
    private readonly quantity: number,
    private readonly unitPrice: Money,
  ) {
    if (quantity <= 0) throw new Error('Quantity must be positive');
  }

  getSubtotal(): Money {
    return Money.create(
      this.unitPrice.getAmount() * this.quantity,
      this.unitPrice.getCurrency(),
    );
  }
}
```

### Example 3: Aggregate root with domain events

```typescript
// domain/aggregates/order.aggregate.ts
export class Order extends AggregateRoot {
  private items: OrderItem[] = [];
  private status: OrderStatus = OrderStatus.PENDING;

  addItem(item: OrderItem): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error('Cannot modify confirmed order');
    }
    this.items.push(item);
  }

  confirm(): void {
    if (this.items.length === 0) {
      throw new Error('Cannot confirm empty order');
    }
    this.status = OrderStatus.CONFIRMED;
    this.apply(new OrderCreatedEvent(this.id, this.customerId));
  }
}
```

### Example 4: Repository port

```typescript
// domain/repositories/order-repository.port.ts
export interface OrderRepositoryPort {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');
```

**BountyHack equivalent:** `auth/ports/auth.repository.ts`, `users/ports/user-repository.interface.ts`

### Example 5: Use case (application layer)

```typescript
@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    const order = new Order(crypto.randomUUID(), input.customerId);
    // ... add items, confirm, save
    await this.orderRepository.save(order);
    return { orderId: order.getId(), total: order.getTotal().getAmount() };
  }
}
```

**BountyHack equivalent:** `RegisterWithPasswordCommand`, `UpdateOwnProfileCommand`

### Example 6: Repository adapter (infrastructure)

```typescript
@Injectable()
export class OrderRepository implements OrderRepositoryPort {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
  ) {}

  async save(order: Order): Promise<void> {
    await this.repository.save(this.toEntity(order));
  }

  private toDomain(entity: OrderEntity): Order { /* mapping */ }
  private toEntity(order: Order): OrderEntity { /* mapping */ }
}
```

**BountyHack equivalent:** `prisma-user-repository.ts` + `quality-prisma.mapper.ts` (Prisma, not TypeORM)

### Example 7: Controller adapter

```typescript
@Controller('orders')
export class OrderController {
  constructor(private readonly createOrderUseCase: CreateOrderUseCase) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.createOrderUseCase.execute(dto);
  }
}
```

**BountyHack equivalent:** map DTO → application input first (`toRegisterWithPasswordInput`), then call command.

### Example 8: Module configuration

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity])],
  controllers: [OrderController],
  providers: [
    CreateOrderUseCase,
    { provide: ORDER_REPOSITORY, useClass: OrderRepository },
  ],
})
export class OrdersModule {}
```

**BountyHack equivalent:** `auth.module.ts`, `user.module.ts` — conditional providers based on `DATABASE_NAME`.

## B.6 Generic best practices

1. **Dependency rule**: dependencies point inward — domain knows nothing about NestJS or ORM
2. **Rich domain models**: business logic in entities when invariants justify it — avoid anemic models **when complexity warrants it**
3. **Immutability**: value objects use private constructors + static factories
4. **Interface segregation**: small, focused repository ports
5. **Constructor injection**: NestJS DI in outer layers; plain constructors in domain
6. **Validation at boundaries**: DTOs at HTTP; invariants in domain
7. **Pure domain tests**: no Nest testing module required
8. **Transactions in application layer**, not domain
9. **Symbol tokens** for DI (`Symbol('ORDER_REPOSITORY')`)
10. **Aggregate roots** protect invariants — access entities through aggregates when using DDD aggregates

## B.7 Generic constraints and warnings

### Architecture constraints

- Inner layers must not depend on outer layers
- Domain layer: zero framework dependencies
- Repository interfaces in domain/application; implementations in adapters
- Value objects: immutable, no setters

### Common pitfalls

- ORM entities leaking into domain
- Anemic domain (logic only in services) **when the domain is actually complex**
- Framework decorators in domain entities
- Direct dependency on concrete implementations instead of ports
- **Over-engineering**: full clean architecture for trivial CRUD

### Implementation warnings

- Mapping overhead between domain and persistence
- Team must understand DDD before heavy adoption
- More boilerplate than traditional layered MVC
- Manage transactions at application layer

## B.8 Mapping generic concepts → BountyHack

| Generic concept | BountyHack location |
|-----------------|---------------------|
| Use case | `*.command.ts` / `*.query.ts` |
| Application DTO | `application/models/*.input.ts`, `payloads/` |
| HTTP DTO | `dto/` |
| Repository port | `ports/` |
| Repository adapter | `adapters/postgre-prisma/`, `adapters/postgre/` |
| Controller | `controllers/` |
| HTTP mapper | `adapters/http/` |
| Domain entity | `domain/models/` (thin) or `models/` (read/write shapes) |
| Module wiring | `<feature>.module.ts`, `core/app.module.ts` |
| Infrastructure | `core/`, `generated/prisma/`, `adapters/` |
