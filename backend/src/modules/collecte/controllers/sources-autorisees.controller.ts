import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { RolesGuard } from '../../../common/guards/roles.guard';
import {
  CreerSourceAutoriseeDto,
  ModifierSourceAutoriseeDto,
} from '../dto/creer-source-autorisee.dto';
import { SourcesAutoriseesService } from '../services/sources-autorisees.service';

/**
 * Gestion de la liste blanche des sources de collecte (réservé à l'ADMIN).
 * Pas de DELETE : on désactive une source (traçabilité des ingestions passées).
 */
@ApiTags('Collecte / Veille')
@ApiBearerAuth()
@Controller('collecte/sources')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class SourcesAutoriseesController {
  constructor(private readonly sourcesService: SourcesAutoriseesService) {}

  @Get()
  @ApiOperation({
    summary: 'Liste blanche des sources (actives et désactivées)',
  })
  lister() {
    return this.sourcesService.lister();
  }

  @Post()
  @ApiOperation({ summary: 'Ajouter une source à la liste blanche' })
  creer(@Body() dto: CreerSourceAutoriseeDto) {
    return this.sourcesService.creer(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Modifier une source (libellé, domaine, activer/désactiver)',
  })
  modifier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModifierSourceAutoriseeDto,
  ) {
    return this.sourcesService.modifier(id, dto);
  }
}
