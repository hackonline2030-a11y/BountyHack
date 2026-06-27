import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../core/infrastructure/database/prisma/prisma.module';
import { isPrismaSqlMode } from '../shared/database-mode';
import { InMemoryIpBlacklistStore } from './adapters/in-memory/in-memory-ip-blacklist.store';
import { InMemoryIpWhitelistRepository } from './adapters/in-memory/in-memory-ip-whitelist.repository';
import { IpAccessGuard } from './adapters/http/ip-access.guard';
import { PrismaIpWhitelistRepository } from './adapters/prisma-sql/prisma-ip-whitelist.repository';
import { RedisIpBlacklistStore } from './adapters/redis/redis-ip-blacklist.store';
import { AddIpWhitelistEntryCommand } from './application/commands/add-ip-whitelist-entry.command';
import { BlacklistClientIpCommand } from './application/commands/blacklist-client-ip.command';
import { RemoveIpWhitelistEntryCommand } from './application/commands/remove-ip-whitelist-entry.command';
import { SetIpWhitelistEnabledCommand } from './application/commands/set-ip-whitelist-enabled.command';
import { IpWhitelistSnapshotCache } from './application/ip-whitelist-snapshot.cache';
import { EvaluateClientIpAccessQuery } from './application/queries/evaluate-client-ip-access.query';
import { ListIpWhitelistEntriesQuery } from './application/queries/list-ip-whitelist-entries.query';
import { IpWhitelistAdminController } from './controllers/ip-whitelist-admin.controller';
import { I_IP_BLACKLIST_STORE } from './ports/ip-blacklist-store.interface';
import { I_IP_WHITELIST_REPOSITORY } from './ports/ip-whitelist-repository.interface';

function resolveIpBlacklistStoreClass(
  config: ConfigService,
): typeof RedisIpBlacklistStore | typeof InMemoryIpBlacklistStore {
  const mode = (config.get<string>('IP_ACCESS_STORE') ?? '')
    .trim()
    .toLowerCase();
  if (mode === 'memory') {
    return InMemoryIpBlacklistStore;
  }
  const explicitUrl = config.get<string>('REDIS_URL')?.trim();
  const useRedis = mode === 'redis' || Boolean(explicitUrl);
  return useRedis ? RedisIpBlacklistStore : InMemoryIpBlacklistStore;
}

function resolveIpWhitelistRepositoryClass():
  | typeof PrismaIpWhitelistRepository
  | typeof InMemoryIpWhitelistRepository {
  return isPrismaSqlMode()
    ? PrismaIpWhitelistRepository
    : InMemoryIpWhitelistRepository;
}

const adminControllers = isPrismaSqlMode() ? [IpWhitelistAdminController] : [];

@Module({
  imports: [ConfigModule, ...(isPrismaSqlMode() ? [PrismaModule] : [])],
  controllers: adminControllers,
  providers: [
    IpAccessGuard,
    IpWhitelistSnapshotCache,
    EvaluateClientIpAccessQuery,
    ListIpWhitelistEntriesQuery,
    BlacklistClientIpCommand,
    AddIpWhitelistEntryCommand,
    RemoveIpWhitelistEntryCommand,
    SetIpWhitelistEnabledCommand,
    {
      provide: I_IP_BLACKLIST_STORE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const StoreClass = resolveIpBlacklistStoreClass(config);
        return new StoreClass(config);
      },
    },
    {
      provide: I_IP_WHITELIST_REPOSITORY,
      useClass: resolveIpWhitelistRepositoryClass(),
    },
  ],
  exports: [
    BlacklistClientIpCommand,
    EvaluateClientIpAccessQuery,
    IpAccessGuard,
    I_IP_BLACKLIST_STORE,
  ],
})
export class IpAccessModule {}
