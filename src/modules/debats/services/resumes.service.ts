import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import {
  DEBAT_RESUME_VALIDE,
  DebatResumeValidePayload,
} from '../../feed/events/debat-resume-valide.event';
import { IA_SERVICE, IaService } from '../../ia/ia-service.interface';
import { ValiderResumeDto } from '../dto/valider-resume.dto';
import { ResumeDebat } from '../entities/resume-debat.entity';
import { StatutDebat } from '../enums/debats.enums';
import { StatutResume } from '../enums/statut-resume.enum';
import { LiveService } from './live.service';

@Injectable()
export class ResumesService {
  constructor(
    @InjectRepository(ResumeDebat)
    private readonly resumeRepo: Repository<ResumeDebat>,
    @Inject(IA_SERVICE)
    private readonly iaService: IaService,
    private readonly liveService: LiveService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Génère (IA) le résumé d'un débat TERMINÉ à partir de son déroulé et des
   * résultats de vote. Statut EN_ATTENTE_VALIDATION : invisible du public.
   */
  async generer(debatId: string): Promise<ResumeDebat> {
    const debat = await this.liveService.getDebatComplet(debatId);
    if (debat.statut !== StatutDebat.TERMINE) {
      throw new BadRequestException(
        `Le résumé ne peut être généré que sur un débat terminé (statut actuel : ${debat.statut})`,
      );
    }

    const affirmations = await this.liveService.etatDesVotes(debatId);
    const texteGenereIA = await this.iaService.genererResumeDebat({
      titre: debat.titre,
      thematique: debat.thematique.libelle,
      description: debat.description,
      affirmations: affirmations.map((a) => ({
        texte: a.texte,
        valides: a.valides,
        invalides: a.invalides,
      })),
    });

    return this.resumeRepo.save(
      this.resumeRepo.create({ debat, texteGenereIA }),
    );
  }

  findAll(debatId?: string, statut?: StatutResume): Promise<ResumeDebat[]> {
    return this.resumeRepo.find({
      where: {
        ...(debatId ? { debat: { id: debatId } } : {}),
        ...(statut ? { statut } : {}),
      },
      relations: { debat: { thematique: true } },
      order: { dateGeneration: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ResumeDebat> {
    const resume = await this.resumeRepo.findOne({
      where: { id },
      relations: { debat: { thematique: true } },
    });
    if (!resume) {
      throw new NotFoundException(`Résumé ${id} introuvable`);
    }
    return resume;
  }

  /**
   * Validation humaine : publie le résumé (éventuellement corrigé) et émet
   * debat.resume.valide → le Feed (Dev A) le publie automatiquement comme
   * contenu. C'est le dernier point de couplage inter-équipes (contrat n°3).
   */
  async valider(id: string, dto: ValiderResumeDto, user: AuthUser): Promise<ResumeDebat> {
    const resume = await this.findOne(id);
    if (resume.statut !== StatutResume.EN_ATTENTE_VALIDATION) {
      throw new BadRequestException(
        `Ce résumé est déjà ${resume.statut} — seul un résumé en attente peut être validé`,
      );
    }
    resume.texteFinal = dto.texteCorrige ?? resume.texteGenereIA;
    resume.statut = StatutResume.PUBLIE;
    resume.valideParUserId = user.id;
    resume.dateValidation = new Date();
    const sauvegarde = await this.resumeRepo.save(resume);

    this.eventEmitter.emit(DEBAT_RESUME_VALIDE, {
      debatId: resume.debat.id,
      titre: resume.debat.titre,
      texteResume: sauvegarde.texteFinal!,
      thematiqueId: resume.debat.thematique.id,
      valideParUserId: user.id,
      urlReplay: resume.debat.urlReplay ?? undefined,
    } satisfies DebatResumeValidePayload);

    return sauvegarde;
  }

  /** Rejet par l'admin — conservé pour traçabilité, jamais publié */
  async rejeter(id: string): Promise<ResumeDebat> {
    const resume = await this.findOne(id);
    if (resume.statut !== StatutResume.EN_ATTENTE_VALIDATION) {
      throw new BadRequestException(
        `Ce résumé est déjà ${resume.statut} — seul un résumé en attente peut être rejeté`,
      );
    }
    resume.statut = StatutResume.REJETE;
    return this.resumeRepo.save(resume);
  }
}
