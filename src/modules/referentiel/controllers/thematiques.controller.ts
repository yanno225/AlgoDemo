import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateThematiqueDto } from '../dto/create-thematique.dto';
import { UpdateThematiqueDto } from '../dto/update-thematique.dto';
import { ThematiquesService } from '../services/thematiques.service';

@ApiTags('Référentiel — Thématiques')
@ApiHeader({
  name: 'X-Debug-Role',
  description:
    'PROVISOIRE : rôle simulé (ADMIN requis pour POST/PATCH/DELETE) — remplacé à terme par le JWT',
  required: false,
})
@Controller('thematiques')
@UseGuards(RolesGuard) // Sans @Roles sur la route, l'accès reste public (lectures)
export class ThematiquesController {
  constructor(private readonly thematiquesService: ThematiquesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les thématiques (public)' })
  findAll() {
    return this.thematiquesService.findAll();
  }

  // ⚠️ Déclarée AVANT ':id' pour que "arbre" ne soit pas interprété comme un UUID
  @Get('arbre')
  @ApiOperation({
    summary:
      'Hiérarchie complète thématiques › critères › indicateurs (public) — filtres du Feed et Fiche-pays',
  })
  arbre() {
    return this.thematiquesService.arbre();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une thématique avec ses critères (public)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.thematiquesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Créer une thématique (ADMIN)' })
  create(@Body() dto: CreateThematiqueDto) {
    return this.thematiquesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Modifier une thématique (ADMIN)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateThematiqueDto,
  ) {
    return this.thematiquesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Supprimer une thématique et, en cascade, ses critères/indicateurs (ADMIN)',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.thematiquesService.remove(id);
  }
}
