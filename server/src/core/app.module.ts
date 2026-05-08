import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { AppService } from './app.service';

import { PingModule } from '../ping/ping.module';

import { AuthModule } from '../auth/auth.module';
import { FirebaseAuthMiddleware } from '../auth/firebase-auth.middleware';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { UserModule } from '../users/user.module';
import { DocumentRenderingModule } from '../document-rendering/pdf.module';
import { CommonModule } from './common.module';
import { AppController } from './app.controller';
import { variables } from '../shared/variables.config';
import { PrismaModule } from '../database/prisma.module';
import { isFirebaseAuthEnabled } from '../auth/config/auth-env';

const prismaImports =
  variables.database === 'POSTGRESQL_PRISMA' ? [PrismaModule] : [];

const baseImports = [
  PingModule,
  AuthModule,
  UserModule,
  DocumentRenderingModule,
  CommonModule,
];

const mongooseRoot =
  variables.database === 'MONGODB'
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
  imports: [...prismaImports, ...mongooseRoot, ...baseImports],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    if (!isFirebaseAuthEnabled()) {
      return;
    }
    consumer
      .apply(FirebaseAuthMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
