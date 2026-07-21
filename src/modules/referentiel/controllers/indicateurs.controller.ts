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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateIndicateurDto } from '../dto/create-indicateur.dto';
import { UpdateIndicateurDto } from '../dto/update-indicateur.dto';
import { IndicateursService } from '../services/indicateurs.service';

@ApiTags('Référentiel — Indicateurs')
@ApiBearerAuth() // requis pour POST/PATCH/DELETE (ADMIN) — sans effet sur les routes GET, publiques
@Controller('indicateurs')
@UseGuards(RolesGuard)
export class IndicateursController {
  constructor(private readonly indicateursService: IndicateursService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les indicateurs avec critère et thématique (public)',
  })
  findAll() {
    return this.indicateursService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un indicateur (public)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.indicateursService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Créer un indicateur rattaché à un critère (ADMIN)' })
  create(@Body() dto: CreateIndicateurDto) {
    return this.indicateursService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Modifier / re-rattacher un indicateur (ADMIN)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIndicateurDto,
  ) {
    return this.indicateursService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un indicateur (ADMIN)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.indicateursService.remove(id);
  }
}
