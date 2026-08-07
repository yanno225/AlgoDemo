import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

/**
 * Stockage média S3-compatible (socle transverse, CDC §3.0) : upload des
 * vidéos/images des contenus, replays de débats, fichiers audio.
 * MinIO en dev (docker-compose) ; n'importe quel S3 en production.
 */
@Module({
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
