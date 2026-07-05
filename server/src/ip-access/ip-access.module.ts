import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../core/infrastructure/database/prisma/prisma.module';
import { isPrismaSqlMode } from '../shared/database-mode';
import { InMemoryIpWhitelistRepository } from './adapters/in-memory/in-memory-ip-whitelist.repository';
import { IpAccessGuard } from './adapters/http/ip-access.guard';
import { PrismaIpWhitelistRepository } from './adapters/prisma-sql/prisma-ip-whitelist.repository';
import { AddIpWhitelistEntryCommand } from './application/commands/add-ip-whitelist-entry.command';
import { RemoveIpWhitelistEntryCommand } from './application/commands/remove-ip-whitelist-entry.command';
import { SetIpWhitelistEnabledCommand } from './application/commands/set-ip-whitelist-enabled.command';
import { IpWhitelistSnapshotCache } from './application/ip-whitelist-snapshot.cache';
import { EvaluateClientIpAccessQuery } from './application/queries/evaluate-client-ip-access.query';
import { ListIpWhitelistEntriesQuery } from './application/queries/list-ip-whitelist-entries.query';
import { IpWhitelistAdminController } from './controllers/ip-whitelist-admin.controller';
import { I_IP_WHITELIST_REPOSITORY } from './ports/ip-whitelist-repository.interface';

function resolveIpSqlRepositoryClass<TPrisma, TMemory>(
  PrismaClass: TPrisma,
  MemoryClass: TMemory,
): TPrisma | TMemory {
  return isPrismaSqlMode() ? PrismaClass : MemoryClass;
}

@Module({
  imports: [ConfigModule, ...(isPrismaSqlMode() ? [PrismaModule] : [])],
  controllers: [IpWhitelistAdminController],
  providers: [
    IpAccessGuard,
    IpWhitelistSnapshotCache,
    EvaluateClientIpAccessQuery,
    ListIpWhitelistEntriesQuery,
    AddIpWhitelistEntryCommand,
    RemoveIpWhitelistEntryCommand,
    SetIpWhitelistEnabledCommand,
    {
      provide: I_IP_WHITELIST_REPOSITORY,
      useClass: resolveIpSqlRepositoryClass(
        PrismaIpWhitelistRepository,
        InMemoryIpWhitelistRepository,
      ),
    },
  ],
  exports: [EvaluateClientIpAccessQuery, IpAccessGuard],
})
export class IpAccessModule {}
