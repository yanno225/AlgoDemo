import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { FichePaysService } from '../services/fiche-pays.service';

@ApiTags('Fiche-pays')
@Controller('fiche-pays')
export class FichePaysController {
  constructor(private readonly fichePaysService: FichePaysService) {}

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
