import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';
import { User } from '../entities/user.entity';

/** Vue publique d'un utilisateur — jamais de champ sensible (hash, secret 2FA...) */
export class UserProfileDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() nom!: string;
  @ApiProperty() prenom!: string;
  @ApiProperty({ required: false, nullable: true }) telephone?: string | null;
  @ApiProperty({ enum: Role }) role!: Role;
  @ApiProperty() emailVerifie!: boolean;
  @ApiProperty() compteValide!: boolean;
  @ApiProperty() estBloque!: boolean;
  @ApiProperty() deuxFaActif!: boolean;
  @ApiProperty() consentementNotifications!: boolean;
  @ApiProperty({ required: false, nullable: true })
  politiqueConfidentialiteAccepteeLe?: Date | null;
  @ApiProperty() creeLe!: Date;

  static depuis(user: User): UserProfileDto {
    const dto = new UserProfileDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.nom = user.nom;
    dto.prenom = user.prenom;
    dto.telephone = user.telephone ?? null;
    dto.role = user.role;
    dto.emailVerifie = user.emailVerifie;
    dto.compteValide = user.compteValide;
    dto.estBloque = user.estBloque;
    dto.deuxFaActif = user.deuxFaActif;
    dto.consentementNotifications = user.consentementNotifications;
    dto.politiqueConfidentialiteAccepteeLe =
      user.politiqueConfidentialiteAccepteeLe ?? null;
    dto.creeLe = user.creeLe;
    return dto;
  }
}
