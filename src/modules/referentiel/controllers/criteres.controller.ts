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
import { CreateCritereDto } from '../dto/create-critere.dto';
import { UpdateCritereDto } from '../dto/update-critere.dto';
import { CriteresService } from '../services/criteres.service';

@ApiTags('Référentiel — Critères')
@ApiHeader({
  name: 'X-Debug-Role',
  description:
    'PROVISOIRE : rôle simulé (ADMIN requis pour POST/PATCH/DELETE) — remplacé à terme par le JWT',
  required: false,
})
@Controller('criteres')
@UseGuards(RolesGuard)
export class CriteresController {
  constructor(private readonly criteresService: CriteresService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les critères avec leur thématique (public)' })
  findAll() {
    return this.criteresService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un critère avec ses indicateurs (public)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.criteresService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Créer un critère rattaché à une thématique (ADMIN)' })
  create(@Body() dto: CreateCritereDto) {
    return this.criteresService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Modifier / re-rattacher un critère (ADMIN)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCritereDto,
  ) {
    return this.criteresService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un critère et, en cascade, ses indicateurs (ADMIN)',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.criteresService.remove(id);
  }
}
