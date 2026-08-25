import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AssistantService } from './assistant.service';

const TOUS_LES_ROLES = [Role.UTILISATEUR, Role.POINT_FOCAL, Role.ADMIN];

export class VerifierAffirmationDto {
  @ApiProperty({ description: "L'affirmation à confronter aux données mesurées" })
  @IsString()
  @IsNotEmpty({ message: "L'affirmation est obligatoire" })
  @MaxLength(500)
  affirmation!: string;
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
}
