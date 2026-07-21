import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../auth/services/users.service';
import { Avis } from '../../consultations/entities/avis.entity';
import { Consultation } from '../../consultations/entities/consultation.entity';
import { StatutModeration } from '../../consultations/enums/statut-moderation.enum';
import { Contenu } from '../../feed/entities/contenu.entity';
import { Signalement } from '../../feed/entities/signalement.entity';
import { StatutSignalement } from '../../feed/enums/statut-signalement.enum';

export interface StatistiquesBackOffice {
  utilisateurs: Awaited<ReturnType<UsersService['statistiques']>>;
  contenus: { total: number; publies: number; nonPublies: number };
  consultations: { total: number; ouvertes: number; cloturees: number };
  avis: { enAttente: number; approuves: number; rejetes: number };
  signalements: { enAttente: number };
}

/** Dashboard back-office : stats utilisateurs, contenus, consultations, signalements (§3.10) */
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Contenu)
    private readonly contenuRepo: Repository<Contenu>,
    @InjectRepository(Consultation)
    private readonly consultationRepo: Repository<Consultation>,
    @InjectRepository(Avis)
    private readonly avisRepo: Repository<Avis>,
    @InjectRepository(Signalement)
    private readonly signalementRepo: Repository<Signalement>,
    private readonly usersService: UsersService,
  ) {}

  async stats(): Promise<StatistiquesBackOffice> {
    const [
      utilisateurs,
      contenusTotal,
      contenusPublies,
      consultationsTotal,
      consultationsOuvertes,
      avisEnAttente,
      avisApprouves,
      avisRejetes,
      signalementsEnAttente,
    ] = await Promise.all([
      this.usersService.statistiques(),
      this.contenuRepo.count(),
      this.contenuRepo.count({ where: { estPublie: true } }),
      this.consultationRepo.count(),
      this.consultationRepo
        .createQueryBuilder('c')
        .where('c.dateOuverture <= NOW() AND c.dateCloture >= NOW()')
        .getCount(),
      this.avisRepo.count({ where: { statutModeration: StatutModeration.EN_ATTENTE } }),
      this.avisRepo.count({ where: { statutModeration: StatutModeration.APPROUVE } }),
      this.avisRepo.count({ where: { statutModeration: StatutModeration.REJETE } }),
      this.signalementRepo.count({ where: { statut: StatutSignalement.EN_ATTENTE } }),
    ]);

    return {
      utilisateurs,
      contenus: {
        total: contenusTotal,
        publies: contenusPublies,
        nonPublies: contenusTotal - contenusPublies,
      },
      consultations: {
        total: consultationsTotal,
        ouvertes: consultationsOuvertes,
        cloturees: consultationsTotal - consultationsOuvertes,
      },
      avis: { enAttente: avisEnAttente, approuves: avisApprouves, rejetes: avisRejetes },
      signalements: { enAttente: signalementsEnAttente },
    };
  }
}
