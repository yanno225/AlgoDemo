import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignalementCitoyen } from './entities/signalement-citoyen.entity';
import { SignalementsCitoyensController } from './signalements-citoyens.controller';
import { SignalementsCitoyensService } from './services/signalements-citoyens.service';

/**
 * Participation citoyenne de terrain (CDC §6.1) : les signalements déposés
 * depuis l'application, suivis par les gestionnaires dans le back-office.
 */
@Module({
  imports: [TypeOrmModule.forFeature([SignalementCitoyen])],
  controllers: [SignalementsCitoyensController],
  providers: [SignalementsCitoyensService],
})
export class ParticipationModule {}
