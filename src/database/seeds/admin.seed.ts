/**
 * Seed du compte ADMINISTRATEUR initial — DÉVELOPPEMENT UNIQUEMENT.
 *
 * Résout le problème d'amorçage : attribuer le rôle ADMIN exige d'être admin
 * (PATCH /auth/users/:id/role). Ce seed crée donc le tout premier compte admin
 * s'il n'en existe aucun. En production, changer immédiatement ce mot de passe
 * (ou créer l'admin réel puis supprimer celui-ci).
 *
 * Identifiants de développement :
 *   email        : admin@algodemo.local
 *   mot de passe : Admin1234!
 *
 * Idempotent : ne fait rien si un ADMIN existe déjà.
 * Lancement : npm run seed
 */
import * as bcrypt from 'bcryptjs';
import { Role } from '../../common/enums/role.enum';
import dataSource from '../../config/typeorm-datasource';
import { User } from '../../modules/auth/entities/user.entity';

const EMAIL = 'admin@algodemo.local';
const MOT_DE_PASSE = 'Admin1234!';
const BCRYPT_ROUNDS = 10;

async function seed(): Promise<void> {
  await dataSource.initialize();
  const userRepo = dataSource.getRepository(User);

  const adminExistant = await userRepo.findOneBy({ role: Role.ADMIN });
  if (adminExistant) {
    console.log(
      `Seed admin : un administrateur existe déjà (${adminExistant.email}) — rien à faire.`,
    );
  } else {
    await userRepo.save(
      userRepo.create({
        email: EMAIL,
        motDePasseHash: await bcrypt.hash(MOT_DE_PASSE, BCRYPT_ROUNDS),
        nom: 'Admin',
        prenom: 'Laboratoire',
        role: Role.ADMIN,
        emailVerifie: true,
        compteValide: true,
      }),
    );
    console.log(
      `Seed admin : compte administrateur de développement créé (${EMAIL} / ${MOT_DE_PASSE}).`,
    );
  }
  await dataSource.destroy();
}

seed().catch((erreur) => {
  console.error('Échec du seed admin :', erreur);
  process.exit(1);
});
