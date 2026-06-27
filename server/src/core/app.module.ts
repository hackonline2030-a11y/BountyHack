import {
  Module,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { HitLimitGuard, HitLimitModule } from './rate-limit/hitlimit';
import { createHitLimitModuleOptions } from './rate-limit/hitlimit.factory';
import { IpAccessModule } from '../ip-access/ip-access.module';
import { IpAccessGuard } from '../ip-access/adapters/http/ip-access.guard';

import { AppService } from './app.service';

import { PingModule } from '../ping/ping.module';

import { AuthModule } from '../auth/auth.module';

import { MongooseModule } from '@nestjs/mongoose';

import { UserModule } from '../users/user.module';
import { DocumentRenderingModule } from '../document-rendering/pdf.module';
import { CommonModule } from './common.module';
import { AppController } from './app.controller';
import { DATABASE_MODES, isPrismaSqlMode } from '../shared/database-mode';
import { variables } from '../shared/variables.config';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { ReportDraftModule } from '../report-draft/report-draft.module';
import { ReportDraftDevModule } from '../report-draft/dev/report-draft-dev.module';
import { ReportTeamModule } from '../report-team/report-team.module';
import { QualityModule } from '../quality/quality.module';
import { isReportDraftDevRoutesEnabled } from '../shared/dev-routes.util';

const prismaImports = isPrismaSqlMode() ? [PrismaModule] : [];

const reportDraftImports = isPrismaSqlMode() ? [ReportDraftModule] : [];

const reportDraftDevImports =
  isPrismaSqlMode() && isReportDraftDevRoutesEnabled()
    ? [ReportDraftDevModule]
    : [];

const reportTeamImports = isPrismaSqlMode() ? [ReportTeamModule] : [];

const qualityImports = isPrismaSqlMode() ? [QualityModule] : [];

const baseImports = [
  PingModule,
  AuthModule,
  UserModule,
  DocumentRenderingModule,
  CommonModule,
  ...reportDraftImports,
  ...reportDraftDevImports,
  ...reportTeamImports,
  ...qualityImports,
];

const mongooseRoot =
  variables.database === DATABASE_MODES.MONGODB
    ? [
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (config: ConfigService) => ({
            uri: config.get<string>('DATABASE_URL'),
          }),
        }),
      ]
    : [];

@Module({
  imports: [
    IpAccessModule,
    HitLimitModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createHitLimitModuleOptions(config),
    }),
    ...prismaImports,
    ...mongooseRoot,
    ...baseImports,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: IpAccessGuard },
    { provide: APP_GUARD, useClass: HitLimitGuard },
  ],
})
export class AppModule {}
