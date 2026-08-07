import { PartialType } from '@nestjs/swagger';
import { CreateContenuDto } from './create-contenu.dto';

/** Tous les champs de la création, rendus optionnels */
export class UpdateContenuDto extends PartialType(CreateContenuDto) {}
