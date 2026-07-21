import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DEBAT_RESUME_VALIDE,
  DebatResumeValidePayload,
} from '../events/debat-resume-valide.event';
import { FeedService } from '../services/feed.service';

/** Réception des résumés de débats publiés automatiquement (contrat A+B, §3.2/§3.5) */
@Injectable()
export class DebatResumeListener {
  private readonly logger = new Logger(DebatResumeListener.name);

  constructor(private readonly feedService: FeedService) {}

  @OnEvent(DEBAT_RESUME_VALIDE)
  async handle(payload: DebatResumeValidePayload): Promise<void> {
    const contenu = await this.feedService.publierResumeDebat(payload);
    this.logger.log(
      `Résumé du débat ${payload.debatId} publié au feed en tant que contenu ${contenu.id}`,
    );
  }
}
