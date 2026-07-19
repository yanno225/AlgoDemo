/**
 * Seed du Référentiel : les 5 thématiques officielles du CDC (§5) et leurs
 * critères retenus (les critères "en cours d'arbitrage" sont exclus).
 * Les indicateurs seront ajoutés plus tard (import ou CRUD admin) — la
 * structure est prête.
 *
 * Idempotent : ré-exécutable sans créer de doublons.
 * Lancement : npm run seed
 */
import dataSource from '../../config/typeorm-datasource';
import { Critere } from '../../modules/referentiel/entities/critere.entity';
import { Thematique } from '../../modules/referentiel/entities/thematique.entity';

const REFERENTIEL: { libelle: string; criteres: string[] }[] = [
  {
    libelle: 'Genre et Société',
    criteres: [
      'Égalité et inclusion sociale',
      'Violences basées sur le genre',
      "Accès à l'éducation et à la formation des groupes vulnérables",
    ],
  },
  {
    libelle: 'Jeunesse et Société',
    criteres: [
      'Participation citoyenne et politique des jeunes',
      'Autonomisation socio-économique des jeunes',
      "Accès à l'éducation, à la formation et aux compétences",
      'Inclusion numérique des jeunes',
      'Accès aux services sociaux de base',
      'Vulnérabilité sociale des jeunes',
    ],
  },
  {
    libelle: 'Droit',
    criteres: [
      'Accès à la justice',
      "Effectivité de l'application du droit",
      'Confiance des citoyens dans la justice',
      "Promotion et protection des droits et de l'égalité",
    ],
  },
  {
    libelle: 'Politique',
    criteres: [
      'Confiance dans les institutions et acteurs politiques',
      'Participation politique des citoyens',
      'Qualité de la gouvernance publique',
      "Respect de l'État de droit",
      'Connaissance du système électoral',
    ],
  },
  {
    libelle: 'Société et Vivant',
    criteres: [
      'Accès aux besoins essentiels',
      'État de santé des populations',
      'Accès au logement',
      "Protection de l'environnement et écologie",
      'Interaction société-environnement',
    ],
  },
];

async function seed(): Promise<void> {
  await dataSource.initialize();
  const thematiqueRepo = dataSource.getRepository(Thematique);
  const critereRepo = dataSource.getRepository(Critere);

  let thematiquesCreees = 0;
  let criteresCrees = 0;

  for (const bloc of REFERENTIEL) {
    // Thématique : créée seulement si absente (idempotence)
    let thematique = await thematiqueRepo.findOneBy({ libelle: bloc.libelle });
    if (!thematique) {
      thematique = await thematiqueRepo.save(
        thematiqueRepo.create({ libelle: bloc.libelle }),
      );
      thematiquesCreees++;
    }

    for (const libelleCritere of bloc.criteres) {
      const existe = await critereRepo.findOne({
        where: { libelle: libelleCritere, thematique: { id: thematique.id } },
      });
      if (!existe) {
        await critereRepo.save(
          critereRepo.create({ libelle: libelleCritere, thematique }),
        );
        criteresCrees++;
      }
    }
  }

  console.log(
    `Seed terminé : ${thematiquesCreees} thématique(s) et ${criteresCrees} critère(s) créés ` +
      `(déjà présents : ignorés).`,
  );
  await dataSource.destroy();
}

seed().catch((erreur) => {
  console.error('Échec du seed :', erreur);
  process.exit(1);
});
