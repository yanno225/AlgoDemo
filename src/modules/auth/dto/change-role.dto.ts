import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

/** ADMIN : attribution / certification d'un point focal, changement de rôle */
export class ChangeRoleDto {
  @ApiProperty({ enum: Role, example: Role.POINT_FOCAL })
  @IsEnum(Role)
  role!: Role;
}
