import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  @Roles(Role.POINT_FOCAL, Role.ADMIN)
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
      'Uploader un média (POINT_FOCAL/ADMIN) → URL publique à utiliser dans urlMedia/urlReplay',
  })
  async uploader(@UploadedFile() fichier?: Express.Multer.File) {
    if (!fichier) {
      throw new BadRequestException(
        'Fichier manquant (champ multipart « fichier »)',
      );
    }
    return this.mediaService.uploader(fichier);
  }
}
