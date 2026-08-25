/**
 * Seed de la LISTE BLANCHE initiale des sources de collecte (CDC §7).
 * Sources institutionnelles fiables retenues avec le comité — les admins
 * peuvent en ajouter/désactiver ensuite depuis le back-office.
 *
 * Idempotent : une source déjà présente (même libellé) n'est pas recréée.
 * Lancement : npm run seed:sources
 */
import dataSource from '../../config/typeorm-datasource';
import { SourceAutorisee } from '../../modules/collecte/entities/source-autorisee.entity';

const SOURCES: Pick<SourceAutorisee, 'libelle' | 'domaine' | 'description'>[] = [
  {
    libelle: 'Banque Mondiale',
    domaine: 'worldbank.org',
    description:
      'Données ouvertes de développement (électrification, éducation, emploi…) — connecteur HTTP branché.',
  },
  {
    libelle: 'OMS',
    domaine: 'who.int',
    description:
      'Organisation Mondiale de la Santé — Global Health Observatory (connecteur HTTP branché).',
  },
  {
    libelle: 'ONU',
    domaine: 'un.org',
    description: 'Organisation des Nations Unies — rapports et statistiques officielles.',
  },
  {
    libelle: 'PNUD',
    domaine: 'undp.org',
    description:
      'Programme des Nations Unies pour le Développement — indice de développement humain, gouvernance.',
  },
  {
    libelle: 'UNESCO',
    domaine: 'unesco.org',
    description: 'Éducation, science et culture — statistiques de scolarisation.',
  },
  {
    libelle: 'UNICEF',
    domaine: 'unicef.org',
    description: 'Données sur l’enfance et la jeunesse.',
  },
  {
    libelle: 'CEI',
    domaine: 'cei.ci',
    description:
      'Commission Électorale Indépendante (Côte d’Ivoire) — résultats et participation électorale.',
  },
  {
    libelle: 'INS Côte d’Ivoire',
    domaine: 'ins.ci',
    description:
      'Institut National de la Statistique (Côte d’Ivoire) — recensements et enquêtes nationales.',
  },
  {
    libelle: 'CEDEAO',
    domaine: 'ecowas.int',
    description: 'Communauté Économique des États de l’Afrique de l’Ouest.',
  },
  {
    libelle: 'Union Africaine',
    domaine: 'au.int',
    description: 'Rapports et mécanismes continentaux (MAEP, gouvernance).',
  },
  {
    libelle: 'Afrobarometer',
    domaine: 'afrobarometer.org',
    description:
      'Enquêtes d’opinion panafricaines sur la démocratie et la gouvernance.',
  },
  {
    libelle: 'BAD',
    domaine: 'afdb.org',
    description: 'Banque Africaine de Développement — statistiques économiques.',
  },
];

async function seed(): Promise<void> {
  await dataSource.initialize();
  const sourceRepo = dataSource.getRepository(SourceAutorisee);

  let creees = 0;
  for (const source of SOURCES) {
    const existe = await sourceRepo.findOneBy({ libelle: source.libelle });
    if (existe) continue;
    await sourceRepo.save(sourceRepo.create(source));
    creees++;
  }
  console.log(
    `Seed sources autorisées : ${creees} source(s) créée(s), ${SOURCES.length - creees} déjà présente(s).`,
  );
  await dataSource.destroy();
}

seed().catch((erreur) => {
  console.error('Échec du seed des sources autorisées :', erreur);
  process.exit(1);
});
