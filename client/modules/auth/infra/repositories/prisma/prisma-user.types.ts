/**
 * Prisma persistence shape for User.
 * Zero any: explicit type for mapper input/output.
 * @see https://brandonjf.github.io/brandon-clean-architecture/type-system-validation/
 */

export interface PrismaUserRecord {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  status: boolean;
}

export interface PrismaUserPersistence {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  status: boolean;
}
