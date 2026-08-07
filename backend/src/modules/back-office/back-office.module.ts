import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ConsultationsModule } from '../consultations/consultations.module';
import { FeedModule } from '../feed/feed.module';
import { BackOfficeController } from './back-office.controller';
import { AuditLog } from './entities/audit-log.entity';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { AuditLogService } from './services/audit-log.service';
import { DashboardService } from './services/dashboard.service';
import { ModerationService } from './services/moderation.service';

/**
 * Back-office / modération transverse (CDC §3.10) : dashboard, file de
 * modération unifiée (contenus + avis + signalements) et journal d'audit.
 * Le journal d'audit (`AuditInterceptor`) est enregistré comme `APP_INTERCEPTOR`
 * global : il couvre automatiquement tous les modules, y compris ceux à venir.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    FeedModule, // exporte Repository<Contenu>, Repository<Signalement>
    ConsultationsModule, // exporte Repository<Consultation>, Repository<Avis>
    AuthModule, // fournit UsersService (statistiques utilisateurs)
  ],
  controllers: [BackOfficeController],
  providers: [
    DashboardService,
    ModerationService,
    AuditLogService,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class BackOfficeModule {}
