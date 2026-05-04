import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

import { AppService } from './app.service';

import { PingModule } from '../ping/ping.module';

import { AuthModule } from '../auth/auth.module';
import { AuthMiddleware } from '../auth/auth.middleware';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { UserModule } from '../users/user.module';
import { DocumentRenderingModule } from '../document-rendering/pdf.module';
import { CommonModule } from './common.module';
import { AppController } from './app.controller';
import { variables } from '../shared/variables.config';

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
  imports: [...mongooseRoot, ...baseImports],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
