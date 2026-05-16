import "reflect-metadata";
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MainModule } from './core/main.module';
import { variables } from './shared/variables.config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { Application } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { HttpExceptionBodyDto } from './core/dto/http-exception-body.dto';
import { HttpValidationErrorDto } from './core/dto/http-validation-error.dto';
import { getHttpCorsOrigin, isCorsOpenToAll } from './shared/cors.util';


async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(MainModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: false,
    })
  );

  // Set up EJS as the templating engine
  app.useStaticAssets(join(__dirname, '..', 'static'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  // Serve generated PDFs (written under process.cwd()/pdfs, e.g. from PdfService.htmlToPdf)
  const pdfsDir = join(process.cwd(), 'pdfs');
  if (!existsSync(pdfsDir)) {
    mkdirSync(pdfsDir, { recursive: true });
  }
  app.use('/pdfs', express.static(pdfsDir));
  app.use('/template-assets', express.static(join(process.cwd(), 'templates')));

  app.setGlobalPrefix(variables.globalPrefix);

  // True site root (not under GLOBAL_PREFIX): send browsers to the API mount (e.g. /api).
  const expressApp = app.getHttpAdapter().getInstance() as Application;
  const apiMount = variables.globalPrefix.replace(/^\/+|\/+$/g, '') || 'api';
  expressApp.get('/', (_req, res) => {
    res.redirect(302, `/${apiMount}`);
  });

  const openCors = isCorsOpenToAll();
  const corsOrigin = getHttpCorsOrigin();

  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    exposedHeaders: ['Location'],
    credentials: !openCors,
  });

  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('NestJS API (auth, users, health checks).')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token (Authorization: Bearer <token>)',
      },
      'bearer',
    )
    .build();
  // Always expose the default 400 (validation / BadRequest) body in #/components/schemas for clients & codegen.
  const swaggerOptions = {
    extraModels: [HttpValidationErrorDto, HttpExceptionBodyDto],
  };
  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, swaggerOptions);
  SwaggerModule.setup('api/docs', app, documentFactory);



  await app.listen(variables.port);
  console.log("\x1b[36m *************************************** \n 🌞 API - Version 1.0.0 \n 🏡 Architecture : hexagonale \n *************************************** ");
  const databaseAlternativeByCurrent: Record<string, string> = {
    'IN-MEMORY': 'MONGODB',
  };
  const databaseAlternativeValue = databaseAlternativeByCurrent[variables.database];
  const databaseAlternative = databaseAlternativeValue
    ? ` (alternative: \x1b[36m${databaseAlternativeValue}\x1b[32m)`
    : '';
  Logger.log(
    `🚀 Running on: http://localhost:${variables.port}/${variables.globalPrefix} with 💽 \x1b[35m${variables.database}\x1b[32m as database${databaseAlternative}`,
  );
  Logger.log(
    `🔧 e2e tests are in \x1b[38;5;226m${join(__dirname, '..', 'e2e/src/server')}\x1b[0m`,
  );
  const authType = (process.env.AUTH_TYPE ?? 'PASSPORT_JWT').toUpperCase();
  const authTypeMessages: Record<string, string> = {
    PASSPORT_JWT: 'Auth provider configured: JWT via Passport (AUTH_TYPE=PASSPORT_JWT).',
  };
  const authTypeMessage =
    authTypeMessages[authType] ??
    `Auth provider configured: unknown AUTH_TYPE=${authType}.`;
  Logger.log(
    `🔧 ${authTypeMessage}`,
  );
  Logger.log(
    `📄 Internal api views are in \x1b[35m${join(__dirname, '..', 'views')}\x1b[0m`
  );
  if (variables.database === 'POSTGRESQL_PRISMA') {
    const pgwebHostPort = process.env.PGWEB_HOST_PORT?.trim() || '8087';
    Logger.log(
      `🧭 pgweb (UI SQL depuis la machine hôte) : http://localhost:${pgwebHostPort}/ — slug d’accès : / — surcharger le port : PGWEB_HOST_PORT dans .env (défaut 8087)`,
    );
  }
  if (variables.database === 'MYSQL_PRISMA') {
    const adminerPort = process.env.ADMINER_HOST_PORT?.trim() || '8088';
    Logger.log(
      `🧭 Adminer (UI SQL MySQL sur l’hôte) : http://localhost:${adminerPort}/ — service : mysql — port : ADMINER_HOST_PORT dans .env (défaut 8088)`,
    );
  }
}

bootstrap();




