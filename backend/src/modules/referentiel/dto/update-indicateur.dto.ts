import { PartialType } from '@nestjs/swagger';
import { CreateIndicateurDto } from './create-indicateur.dto';

/** Tous les champs de la création, rendus optionnels (permet aussi de re-rattacher l'indicateur) */
export class UpdateIndicateurDto extends PartialType(CreateIndicateurDto) {}
