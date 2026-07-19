import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Validation globale des DTOs :
  // - whitelist : supprime silencieusement les propriétés non déclarées dans le DTO
  // - forbidNonWhitelisted : rejette la requête (400) si une propriété inconnue est envoyée
  // - transform : convertit le payload en instance du DTO (types respectés)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Filtre d'exceptions global : format d'erreur homogène + journalisation
  app.useGlobalFilters(new AllExceptionsFilter());

  // Documentation Swagger — exposée sur /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AlgoDémo API')
    .setDescription(
      "API backend de l'application de veille citoyenne AlgoDémo. " +
        "⚠️ Authentification provisoire : renseigner l'en-tête X-Debug-Role " +
        '(UTILISATEUR | POINT_FOCAL | ADMIN) sur les routes protégées, ' +
        "en attendant l'authentification JWT.",
    )
    .setVersion('0.1.0')
    .addTag('Référentiel — Thématiques')
    .addTag('Référentiel — Critères')
    .addTag('Référentiel — Indicateurs')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  Logger.log(
    `API démarrée : http://localhost:${port} — Swagger : http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
}

void bootstrap();
