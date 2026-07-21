import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ReferentielModule } from '../referentiel/referentiel.module';
import { AvisController } from './avis.controller';
import { ConsultationsController } from './consultations.controller';
import { Avis } from './entities/avis.entity';
import { ConsultationOption } from './entities/consultation-option.entity';
import { Consultation } from './entities/consultation.entity';
import { Vote } from './entities/vote.entity';
import { AvisService } from './services/avis.service';
import { ConsultationsService } from './services/consultations.service';

/**
 * Module Consultations & Participation (CDC §6.2-§6.3) : consultations à vote
 * unique sécurisé (2FA obligatoire) et avis citoyens rattachés au Référentiel,
 * modérés avant publication.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Consultation, ConsultationOption, Vote, Avis]),
    ReferentielModule, // fournit Repository<Thematique> (rattachement des avis)
    AuthModule, // fournit UsersService (vérification 2FA au vote)
  ],
  controllers: [ConsultationsController, AvisController],
  providers: [ConsultationsService, AvisService],
  // Exporté pour que le back-office (Dev A) agrège consultations/avis dans le dashboard
  exports: [TypeOrmModule],
})
export class ConsultationsModule {}
