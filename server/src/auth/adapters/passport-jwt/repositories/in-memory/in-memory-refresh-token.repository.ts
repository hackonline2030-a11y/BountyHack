import { Injectable } from '@nestjs/common';
import type { IRefreshTokenRepository } from '../../../../ports/refresh-token.repository';
import { hashOpaqueRefreshRaw } from '../../../utils/opaque-refresh-token.util';

type Row = { userId: string; expiresAtMs: number; lastUsedAtMs: number };

@Injectable()
export class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
  private readonly byHash = new Map<string, Row>();

  async store(
    userId: string,
    rawToken: string,
    expiresAt: Date,
  ): Promise<void> {
    const hash = hashOpaqueRefreshRaw(rawToken);
    const now = Date.now();
    this.byHash.set(hash, {
      userId,
      expiresAtMs: expiresAt.getTime(),
      lastUsedAtMs: now,
    });
  }

  async findValidForRotation(
    rawToken: string,
  ): Promise<{ userId: string } | null> {
    const hash = hashOpaqueRefreshRaw(rawToken);
    const row = this.byHash.get(hash);
    if (!row || row.expiresAtMs < Date.now()) {
      return null;
    }
    row.lastUsedAtMs = Date.now();
    return { userId: row.userId };
  }

  async revokeByRawToken(rawToken: string): Promise<void> {
    this.byHash.delete(hashOpaqueRefreshRaw(rawToken));
  }
}
