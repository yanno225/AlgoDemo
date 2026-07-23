import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FichePaysService } from '../services/fiche-pays.service';

@ApiTags('Fiche-pays')
@Controller('fiche-pays')
export class FichePaysController {
  constructor(private readonly fichePaysService: FichePaysService) {}

  // ⚠️ Déclarée AVANT ':pays' pour ne pas être interprétée comme un nom de pays
  @Get('indicateur/:id')
  @ApiOperation({
    summary:
      "Détail public d'un indicateur : toutes les valeurs collectées + sources croisées + article rédigé par l'IA",
  })
  @ApiQuery({ name: 'pays', required: false, example: "Côte d'Ivoire" })
  getIndicateurDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('pays') pays?: string,
  ) {
    return this.fichePaysService.getIndicateurDetail(id, pays);
  }

  @Get(':pays')
  @ApiOperation({
    summary:
      'Fiche-pays complète (public) : thématiques › critères › indicateurs + valeurs datées du pays',
  })
  @ApiParam({
    name: 'pays',
    example: "Côte d'Ivoire",
    description: 'Nom du pays ou de la zone (insensible à la casse)',
  })
  getFichePays(@Param('pays') pays: string) {
    return this.fichePaysService.getFichePays(pays);
  }
}
