import { Injectable, Logger } from '@nestjs/common';

/**
 * Lecture audio TTS des contenus (§7.1, exigence malvoyants).
 *
 * ⚠️ Aucun moteur TTS/stockage média réel n'est branché dans ce dépôt (le
 * MediaService/TTS partagé de la brique socle transverse n'est pas encore
 * implémenté). Cette classe journalise la demande et renvoie une URL
 * placeholder — à remplacer par un vrai appel MediaService avant production.
 */
@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  async genererAudio(contenuId: string, texte: string): Promise<string> {
    this.logger.log(
      `TODO(Dev A — MediaService) : génération audio pour le contenu ${contenuId} (${texte.length} caractères)`,
    );
    return `https://media.algodemo.invalid/audio/${contenuId}.mp3`;
  }
}
