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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { IngererTexteDto } from '../dto/ingerer-texte.dto';
import { StatutProposition } from '../enums/statut-proposition.enum';
import { CollecteService } from '../services/collecte.service';

/**
 * Back-office de la collecte (tout réservé à l'ADMIN). La collecte tourne aussi
 * automatiquement (job hebdomadaire) ; ces routes permettent de la déclencher
 * à la demande et de valider les propositions.
 */
@ApiTags('Collecte / Veille')
@ApiBearerAuth()
@Controller('collecte')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class CollecteController {
  constructor(private readonly collecteService: CollecteService) {}

  @Post('lancer')
  @ApiOperation({
    summary:
      'Déclencher maintenant la collecte de TOUTES les sources (Banque Mondiale, OMS…) → propositions',
  })
  lancer() {
    return this.collecteService.collecterToutesSources();
  }

  @Get('triangulation')
  @ApiOperation({
    summary:
      'Vue triangulation : par indicateur+année, ce que dit chaque source + niveau de concordance',
  })
  @ApiQuery({ name: 'pays', required: false, example: "Côte d'Ivoire" })
  triangulation(@Query('pays') pays?: string) {
    return this.collecteService.triangulation(pays);
  }

  @Post('ingerer-texte')
  @ApiOperation({
    summary:
      'Ingérer un texte (article/rapport) → l’IA en extrait des valeurs → propositions',
  })
  ingererTexte(@Body() dto: IngererTexteDto) {
    return this.collecteService.ingererTexte(dto.texte, dto.source, dto.paysOuZone);
  }

  @Get('indicateur/:id/analyse')
  @ApiOperation({
    summary:
      "Écran admin d'un indicateur : toutes les valeurs collectées (par source) + reformulation rédigée par l'IA",
  })
  @ApiQuery({ name: 'pays', required: false, example: "Côte d'Ivoire" })
  analyserIndicateur(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('pays') pays?: string,
  ) {
    return this.collecteService.analyserIndicateur(id, pays);
  }

  @Get('propositions')
  @ApiOperation({ summary: 'File des propositions de valeurs à valider' })
  @ApiQuery({ name: 'statut', required: false, enum: StatutProposition })
  @ApiQuery({ name: 'pays', required: false, example: "Côte d'Ivoire" })
  listerPropositions(
    @Query('statut') statut?: StatutProposition,
    @Query('pays') pays?: string,
  ) {
    return this.collecteService.findPropositions(statut, pays);
  }

  @Patch('propositions/:id/valider')
  @ApiOperation({
    summary:
      'Valider une proposition → crée/actualise la ValeurIndicateur (visible dans la Fiche-pays)',
  })
  valider(@Param('id', ParseUUIDPipe) id: string) {
    return this.collecteService.valider(id);
  }

  @Patch('propositions/:id/rejeter')
  @ApiOperation({ summary: 'Rejeter une proposition (traçabilité)' })
  rejeter(@Param('id', ParseUUIDPipe) id: string) {
    return this.collecteService.rejeter(id);
  }
}
