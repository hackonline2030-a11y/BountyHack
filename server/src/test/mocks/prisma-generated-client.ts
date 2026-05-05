/// <reference types="jest" />
/**
 * Test double for {@link server/src/generated/prisma/client} — the generated bundle uses ESM
 * (`import.meta`) which Jest + ts-jest (CommonJS) cannot execute. Runtime uses the real generated client.
 */
export class PrismaClient {
  $connect = jest.fn();
  $disconnect = jest.fn();
  $executeRawUnsafe = jest.fn();
  user = {
    findFirst: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  };
}

export namespace Prisma {
  export class PrismaClientKnownRequestError extends Error {
    readonly code?: string;

    constructor(message: string, opts?: { code?: string }) {
      super(message);
      this.name = 'PrismaClientKnownRequestError';
      this.code = opts?.code;
    }
  }
}
