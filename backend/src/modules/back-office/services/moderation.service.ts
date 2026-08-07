import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Avis } from '../../consultations/entities/avis.entity';
import { StatutModeration } from '../../consultations/enums/statut-moderation.enum';
import { Contenu } from '../../feed/entities/contenu.entity';
import { Signalement } from '../../feed/entities/signalement.entity';
import { StatutSignalement } from '../../feed/enums/statut-signalement.enum';
import { StatutVerification } from '../../feed/enums/statut-verification.enum';

const LONGUEUR_EXTRAIT = 140;

export interface ElementModeration {
  type: 'AVIS' | 'CONTENU' | 'SIGNALEMENT';
  id: string;
  resume: string;
  creeLe: Date;
}

/**
 * File de modération unifiée (contenus + avis + signalements — §3.10) :
 *  - avis en attente de décision (module Consultations) ;
 *  - contenus non encore vérifiés/triangulés (module Feed) ;
 *  - signalements de contenu en attente (module Feed).
 */
@Injectable()
export class ModerationService {
  constructor(
    @InjectRepository(Avis)
    private readonly avisRepo: Repository<Avis>,
    @InjectRepository(Contenu)
    private readonly contenuRepo: Repository<Contenu>,
    @InjectRepository(Signalement)
    private readonly signalementRepo: Repository<Signalement>,
  ) {}

  async fileUnifiee(): Promise<ElementModeration[]> {
    const [avis, contenus, signalements] = await Promise.all([
      this.avisRepo.find({
        where: { statutModeration: StatutModeration.EN_ATTENTE },
        order: { creeLe: 'ASC' },
      }),
      this.contenuRepo.find({
        where: { statutVerification: StatutVerification.NON_VERIFIE },
        order: { creeLe: 'ASC' },
      }),
      this.signalementRepo.find({
        where: { statut: StatutSignalement.EN_ATTENTE },
        relations: { contenu: true },
        order: { creeLe: 'ASC' },
      }),
    ]);

    const elements: ElementModeration[] = [
      ...avis.map((a): ElementModeration => ({
        type: 'AVIS',
        id: a.id,
        resume: a.texte.slice(0, LONGUEUR_EXTRAIT),
        creeLe: a.creeLe,
      })),
      ...contenus.map((c): ElementModeration => ({
        type: 'CONTENU',
        id: c.id,
        resume: `À vérifier : « ${c.titre} »`,
        creeLe: c.creeLe,
      })),
      ...signalements.map((s): ElementModeration => ({
        type: 'SIGNALEMENT',
        id: s.id,
        resume: `« ${s.contenu.titre} » — ${s.motif.slice(0, LONGUEUR_EXTRAIT)}`,
        creeLe: s.creeLe,
      })),
    ];

    return elements.sort((a, b) => a.creeLe.getTime() - b.creeLe.getTime());
  }
}
