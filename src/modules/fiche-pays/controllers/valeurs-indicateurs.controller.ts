import {
  BadRequestException,
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
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateValeurIndicateurDto } from '../dto/create-valeur-indicateur.dto';
import { UpdateValeurIndicateurDto } from '../dto/update-valeur-indicateur.dto';
import { ValeursIndicateursService } from '../services/valeurs-indicateurs.service';

@ApiTags('Fiche-pays — Valeurs d’indicateurs')
@ApiHeader({
  name: 'X-Debug-Role',
  description:
    'PROVISOIRE : rôle simulé (ADMIN requis pour POST/PATCH/DELETE/import) — remplacé à terme par le JWT',
  required: false,
})
@Controller('valeurs-indicateurs')
@UseGuards(RolesGuard)
export class ValeursIndicateursController {
  constructor(
    private readonly valeursService: ValeursIndicateursService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lister les valeurs, filtrables par pays et/ou indicateur (public)' })
  @ApiQuery({ name: 'pays', required: false, example: "Côte d'Ivoire" })
  @ApiQuery({ name: 'indicateurId', required: false, description: 'UUID d’un indicateur' })
  findAll(
    @Query('pays') pays?: string,
    @Query('indicateurId') indicateurId?: string,
  ) {
    return this.valeursService.findAll(pays, indicateurId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’une valeur avec son indicateur (public)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.valeursService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Saisir une valeur d’indicateur (ADMIN)' })
  create(@Body() dto: CreateValeurIndicateurDto) {
    return this.valeursService.create(dto);
  }

  @Post('import')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('fichier'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'CSV avec en-tête "indicateurId;valeur;dateMesure;paysOuZone;source" (séparateur ";" ou ",")',
    schema: {
      type: 'object',
      properties: { fichier: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({
    summary:
      'Import en lot de valeurs depuis un CSV (ADMIN) — doublons ignorés, bilan renvoyé',
  })
  importer(@UploadedFile() fichier?: Express.Multer.File) {
    if (!fichier) {
      throw new BadRequestException(
        'Fichier CSV manquant (champ multipart "fichier")',
      );
    }
    return this.valeursService.importerCsv(fichier.buffer.toString('utf-8'));
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Corriger une valeur (ADMIN)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateValeurIndicateurDto,
  ) {
    return this.valeursService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une valeur (ADMIN)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.valeursService.remove(id);
  }
}
