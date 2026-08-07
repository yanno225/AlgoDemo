import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { GenererSyntheseDto } from '../dto/generer-synthese.dto';
import { ValiderSyntheseDto } from '../dto/valider-synthese.dto';
import { StatutSynthese } from '../enums/statut-synthese.enum';
import { SynthesesService } from '../services/syntheses.service';

/**
 * Back-office des synthèses IA (tout est réservé à l'ADMIN) :
 * générer → relire → valider (éventuellement corrigée) ou rejeter.
 * Le public, lui, ne voit les synthèses publiées que via GET /fiche-pays/{pays}.
 */
@ApiTags('Fiche-pays — Synthèses IA')
@ApiBearerAuth() // JWT ADMIN requis sur toutes les routes
@Controller('syntheses')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class SynthesesController {
  constructor(private readonly synthesesService: SynthesesService) {}

  @Post('generer')
  @ApiOperation({
    summary:
      "Déclencher la génération IA d'une synthèse (thématique + pays) — statut EN_ATTENTE_VALIDATION",
  })
  generer(@Body() dto: GenererSyntheseDto) {
    return this.synthesesService.generer(dto);
  }

  @Get()
  @ApiOperation({ summary: 'File de validation : lister les synthèses' })
  @ApiQuery({ name: 'statut', required: false, enum: StatutSynthese })
  @ApiQuery({ name: 'pays', required: false, example: "Côte d'Ivoire" })
  findAll(
    @Query('statut') statut?: StatutSynthese,
    @Query('pays') pays?: string,
  ) {
    return this.synthesesService.findAll(statut, pays);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une synthèse (brouillon IA + version finale)" })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.synthesesService.findOne(id);
  }

  @Patch(':id/valider')
  @ApiOperation({
    summary:
      'Validation humaine : publie la synthèse (texteCorrige facultatif, sinon le texte IA est publié tel quel)',
  })
  valider(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ValiderSyntheseDto,
  ) {
    return this.synthesesService.valider(id, dto);
  }

  @Patch(':id/rejeter')
  @ApiOperation({ summary: 'Rejeter une synthèse (conservée pour traçabilité)' })
  rejeter(@Param('id', ParseUUIDPipe) id: string) {
    return this.synthesesService.rejeter(id);
  }
}
