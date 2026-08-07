import { PartialType } from '@nestjs/swagger';
import { CreateValeurIndicateurDto } from './create-valeur-indicateur.dto';

/** Tous les champs de la création, rendus optionnels */
export class UpdateValeurIndicateurDto extends PartialType(
  CreateValeurIndicateurDto,
) {}
