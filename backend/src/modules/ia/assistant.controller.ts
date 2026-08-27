import {
  BadRequestException,
  Body,
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
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AssistantService } from './assistant.service';

const TOUS_LES_ROLES = [Role.UTILISATEUR, Role.POINT_FOCAL, Role.ADMIN];

/** Types lisibles par l'IA multimodale : images courantes et PDF. */
const TYPES_FICHIER_ANALYSABLES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

/** 10 Mo — assez pour un tract scanné ou un rapport, sans engorger l'API IA. */
const TAILLE_MAX_FICHIER = 10 * 1024 * 1024;

export class VerifierAffirmationDto {
  @ApiProperty({ description: "L'affirmation à confronter aux données mesurées" })
  @IsString()
  @IsNotEmpty({ message: "L'affirmation est obligatoire" })
  @MaxLength(500)
  affirmation!: string;
}

export class VerifierFichierDto {
  @ApiProperty({
    required: false,
    description: 'Question facultative accompagnant le fichier',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  question?: string;
}

/**
 * Assistant citoyen de vérification des faits. Réservé aux comptes
 * authentifiés : chaque vérification a un coût IA réel.
 */
@ApiTags('Assistant IA')
@ApiBearerAuth()
@Controller('assistant')
@UseGuards(RolesGuard)
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('verifier')
  @Roles(...TOUS_LES_ROLES)
  @ApiOperation({
    summary:
      "Confronter une affirmation aux données mesurées de la plateforme — verdict + éléments sourcés, jamais d'invention",
  })
  verifier(@Body() dto: VerifierAffirmationDto) {
    return this.assistantService.verifier(dto.affirmation);
  }

  @Post('verifier-fichier')
  @Roles(...TOUS_LES_ROLES)
  @UseInterceptors(
    FileInterceptor('fichier', { limits: { fileSize: TAILLE_MAX_FICHIER } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Fichier à analyser (image ou PDF, max 10 Mo, champ « fichier ») + question facultative (champ « question »)',
    schema: {
      type: 'object',
      properties: {
        fichier: { type: 'string', format: 'binary' },
        question: { type: 'string' },
      },
    },
  })
  @ApiOperation({
    summary:
      "Vérifier un FICHIER citoyen (image/PDF) : l'IA en extrait les affirmations puis les confronte aux données de la plateforme",
  })
  verifierFichier(
    @UploadedFile() fichier: Express.Multer.File | undefined,
    @Body() dto: VerifierFichierDto,
  ) {
    if (!fichier) {
      throw new BadRequestException(
        'Fichier manquant (champ multipart « fichier »)',
      );
    }
    if (!TYPES_FICHIER_ANALYSABLES.has(fichier.mimetype)) {
      throw new BadRequestException(
        `Type non analysable (${fichier.mimetype}). Acceptés : images JPEG/PNG/WebP/GIF et PDF.`,
      );
    }
    return this.assistantService.verifierFichier(
      { buffer: fichier.buffer, mimetype: fichier.mimetype },
      dto.question,
    );
  }
}
