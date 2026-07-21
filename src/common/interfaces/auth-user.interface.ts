import { Role } from '../enums/role.enum';

/**
 * Forme de `request.user` déposée par le RolesGuard une fois le JWT vérifié.
 * Contrat partagé entre le guard, le décorateur @CurrentUser() et les contrôleurs.
 */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}
