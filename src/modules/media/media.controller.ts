import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MediaService, TAILLE_MAX_OCTETS } from './media.service';

@ApiTags('Média')
@ApiBearerAuth()
@Controller('media')
@UseGuards(RolesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  // Ouvert aux citoyens : la photo d'un signalement de terrain (module
  // Participation) part du téléphone. Tout upload reste authentifié.
  @Roles(Role.UTILISATEUR, Role.POINT_FOCAL, Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('fichier', { limits: { fileSize: TAILLE_MAX_OCTETS } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Fichier média (image, vidéo MP4/WebM, audio, PDF — max 200 Mo), champ multipart « fichier »',
    schema: {
      type: 'object',
      properties: { fichier: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({
    summary:
      'Uploader un média (tout compte authentifié) → URL publique à utiliser dans urlMedia/urlReplay/urlPhoto',
  })
  async uploader(@UploadedFile() fichier?: Express.Multer.File) {
    if (!fichier) {
      throw new BadRequestException(
        'Fichier manquant (champ multipart « fichier »)',
      );
    }
    return this.mediaService.uploader(fichier);
  }

  /**
   * Streaming public des médias publiés (les clés sont de la forme
   * année/mois/uuid.ext). Servi par l'API elle-même : les URL stockées en
   * base sont relatives et suivent l'adresse du serveur sur tout réseau.
   * Range pris en charge (seek vidéo). Route publique — pas de @Roles :
   * les lecteurs vidéo natifs n'envoient pas d'en-tête Authorization.
   */
  @Get('f/:annee/:mois/:fichier')
  @ApiOperation({ summary: 'Streamer un média (public, Range accepté)' })
  async servir(
    @Param('annee') annee: string,
    @Param('mois') mois: string,
    @Param('fichier') fichier: string,
    @Headers('range') range: string | undefined,
    @Res() reponse: Response,
  ): Promise<void> {
    // Clés strictement bornées — aucune traversée de chemin possible
    if (
      !/^\d{4}$/.test(annee) ||
      !/^\d{2}$/.test(mois) ||
      !/^[\w-]+(?:\.[\w-]+)*$/.test(fichier)
    ) {
      throw new NotFoundException('Média introuvable');
    }

    const media = await this.mediaService.telecharger(
      `${annee}/${mois}/${fichier}`,
      range,
    );
    if (!media) {
      throw new NotFoundException('Média introuvable');
    }

    reponse.setHeader('Accept-Ranges', 'bytes');
    reponse.setHeader('Content-Type', media.type);
    // Clés en UUID, jamais réécrites → cache long sans risque
    reponse.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (media.debut !== undefined && media.fin !== undefined) {
      reponse.status(206);
      reponse.setHeader(
        'Content-Range',
        `bytes ${media.debut}-${media.fin}/${media.taille}`,
      );
      reponse.setHeader('Content-Length', String(media.fin - media.debut + 1));
    } else {
      reponse.setHeader('Content-Length', String(media.taille));
    }
    media.flux.pipe(reponse);
  }
}
