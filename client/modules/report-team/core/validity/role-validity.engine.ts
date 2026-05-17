/**
 * Role validity: AND across clauses, OR within each clause.
 * Each inner array is one clause — at least one listed role must be present.
 */

/** One clause: satisfy if any listed role is on the team (OR). */
export type RoleClause<R extends string = string> = ReadonlyArray<R>;

/** Full rule set: every clause must be satisfied (AND). */
export type RoleValidityRules<R extends string = string> = ReadonlyArray<RoleClause<R>>;

export function satisfiesRoleClause<R extends string>(
  present: ReadonlySet<R>,
  clause: RoleClause<R>,
): boolean {
  return clause.some((role) => present.has(role));
}

export function evaluateRoleValidityRules<R extends string>(
  memberRoles: ReadonlyArray<R>,
  rules: RoleValidityRules<R>,
): boolean {
  if (rules.length === 0) return true;
  const present = new Set(memberRoles);
  return rules.every((clause) => satisfiesRoleClause(present, clause));
}

/** Every role in the list is required (AND). One clause per role. */
export function allRolesRequired<R extends string>(
  roles: ReadonlyArray<R>,
): RoleValidityRules<R> {
  return roles.map((role) => [role]);
}

/** At least one role from the list is required (OR). Single clause. */
export function anyRoleRequired<R extends string>(
  roles: ReadonlyArray<R>,
): RoleValidityRules<R> {
  return [roles];
}
