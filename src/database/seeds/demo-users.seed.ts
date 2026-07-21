/**
 * Comptes de DÉMONSTRATION — DÉVELOPPEMENT/TEST UNIQUEMENT.
 *
 * Pour les tests en conditions réelles (ex. live de débat en salle) : des
 * comptes prêts à l'emploi à distribuer aux participants, sans passer par
 * l'inscription + OTP (l'envoi email/SMS n'est pas branché).
 *
 * Mot de passe commun : Demo1234!
 *   citoyen1@algodemo.local … citoyen5@algodemo.local  (UTILISATEUR)
 *   pointfocal@algodemo.local                          (POINT_FOCAL)
 *
 * ⛔ À ne jamais exécuter en production.
 * Idempotent : les comptes existants sont ignorés.
 */
import * as bcrypt from 'bcryptjs';
import { Role } from '../../common/enums/role.enum';
import dataSource from '../../config/typeorm-datasource';
import { User } from '../../modules/auth/entities/user.entity';

const MOT_DE_PASSE = 'Demo1234!';
const BCRYPT_ROUNDS = 10;

const COMPTES: { email: string; nom: string; prenom: string; role: Role }[] = [
  ...[1, 2, 3, 4, 5].map((i) => ({
    email: `citoyen${i}@algodemo.local`,
    nom: 'Démo',
    prenom: `Citoyen ${i}`,
    role: Role.UTILISATEUR,
  })),
  {
    email: 'pointfocal@algodemo.local',
    nom: 'Démo',
    prenom: 'Point Focal',
    role: Role.POINT_FOCAL,
  },
];

async function seed(): Promise<void> {
  await dataSource.initialize();
  const userRepo = dataSource.getRepository(User);
  const hash = await bcrypt.hash(MOT_DE_PASSE, BCRYPT_ROUNDS);

  let crees = 0;
  for (const compte of COMPTES) {
    const existe = await userRepo.findOneBy({ email: compte.email });
    if (!existe) {
      await userRepo.save(
        userRepo.create({
          ...compte,
          motDePasseHash: hash,
          emailVerifie: true,
          compteValide: true,
        }),
      );
      crees++;
    }
  }
  console.log(
    `Seed comptes démo terminé : ${crees} compte(s) créés (mot de passe : ${MOT_DE_PASSE}).`,
  );
  await dataSource.destroy();
}

seed().catch((erreur) => {
  console.error('Échec du seed comptes démo :', erreur);
  process.exit(1);
});
