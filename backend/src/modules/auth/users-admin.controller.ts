import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BloquerCompteDto } from './dto/bloquer-compte.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { ValiderCompteDto } from './dto/valider-compte.dto';
import { UsersService } from './services/users.service';

/**
 * Gestion administrateur des comptes (§9.3) : validation, blocage,
 * attribution/certification des points focaux.
 */
@ApiTags('Auth — Administration des comptes')
@ApiBearerAuth()
@Controller('auth/users')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'ADMIN — liste des comptes' })
  async findAll(): Promise<UserProfileDto[]> {
    const users = await this.usersService.findAll();
    return users.map((u) => UserProfileDto.depuis(u));
  }

  @Patch(':id/valider')
  @ApiOperation({ summary: 'ADMIN — valide (ou invalide) un compte' })
  async valider(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ValiderCompteDto,
  ): Promise<UserProfileDto> {
    const user = await this.usersService.valider(id, dto.valide);
    return UserProfileDto.depuis(user);
  }

  @Patch(':id/bloquer')
  @ApiOperation({ summary: 'ADMIN — bloque (ou débloque) un compte' })
  async bloquer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BloquerCompteDto,
  ): Promise<UserProfileDto> {
    const user = await this.usersService.bloquer(id, dto.bloque);
    return UserProfileDto.depuis(user);
  }

  @Patch(':id/role')
  @ApiOperation({
    summary: 'ADMIN — change le rôle du compte (attribution/certification point focal)',
  })
  async changerRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeRoleDto,
  ): Promise<UserProfileDto> {
    const user = await this.usersService.changerRole(id, dto.role);
    return UserProfileDto.depuis(user);
  }
}
