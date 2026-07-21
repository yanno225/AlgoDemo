/**
 * Seed du Référentiel officiel d'évaluation démocratique.
 *
 * Source : CDC v2 (§5) + « Résultats des travaux en ateliers » ESATIC/FID
 * (tableau complet des indicateurs retenus, section 4).
 * La hiérarchie est FERMÉE : thématiques, critères et indicateurs sont décidés
 * en atelier. Le scraping/IA ne collectera que les VALEURS de ces indicateurs.
 * Les critères « en cours d'arbitrage » (Inclusion des groupes spécifiques,
 * Connaissance et diffusion du droit) sont exclus tant que non tranchés.
 *
 * Idempotent : ré-exécutable sans créer de doublons.
 * Lancement : npm run seed
 */
import dataSource from '../../config/typeorm-datasource';
import { Critere } from '../../modules/referentiel/entities/critere.entity';
import { Indicateur } from '../../modules/referentiel/entities/indicateur.entity';
import { Thematique } from '../../modules/referentiel/entities/thematique.entity';

interface CritereSeed {
  libelle: string;
  indicateurs: string[];
}

interface ThematiqueSeed {
  libelle: string;
  criteres: CritereSeed[];
}

const REFERENTIEL: ThematiqueSeed[] = [
  {
    libelle: 'Genre et Société',
    criteres: [
      {
        libelle: 'Égalité et inclusion sociale',
        indicateurs: [
          'Taux de scolarisation femme/homme',
          "Taux d'insertion professionnelle des personnes portant un handicap",
          'Taux de représentation genrée du travail',
          'Taux de candidatures féminines lors des élections générales',
          'Taux de femmes parmi les élus locaux',
          'Taux des séniors ayant accès à une assurance santé',
          "Taux cumulé des femmes, séniors et personnes vivant avec un handicap participant à la vie institutionnelle de l'État",
        ],
      },
      {
        libelle: 'Violences basées sur le genre',
        indicateurs: [
          'Nombre de cas de VBG signalés',
          'Taux de féminicides',
          "Taux de fréquentation des femmes aux services spécialisés d'assistance aux femmes",
          'Existence de lois spécifiques à la protection des femmes',
        ],
      },
      {
        libelle: "Accès à l'éducation et à la formation des groupes vulnérables",
        indicateurs: [
          'Taux de scolarisation des jeunes filles',
          'Taux de scolarisation des enfants portant un handicap',
          "Nombre d'enfants employés dans un travail illégal",
          "Taux d'alphabétisation",
        ],
      },
    ],
  },
  {
    libelle: 'Jeunesse et Société',
    criteres: [
      {
        libelle: 'Participation citoyenne et politique des jeunes',
        indicateurs: [
          'Proportion des jeunes inscrits sur la liste électorale',
          'Taux de participation des jeunes au processus électoral',
          'Nombre de jeunes dans les instances de décision des partis politiques',
        ],
      },
      {
        libelle: 'Autonomisation socio-économique des jeunes',
        indicateurs: [
          'Taux de chômage chez les jeunes',
          'Nombre de projets de jeunes financés',
          'Taux de pauvreté chez les jeunes',
          'Salaire moyen chez les jeunes',
          "Taux d'insertion professionnelle des jeunes",
        ],
      },
      {
        libelle: "Accès à l'éducation, à la formation et aux compétences",
        indicateurs: [
          'Taux de scolarisation des jeunes',
          'Taux de jeunes participant à une formation citoyenne',
        ],
      },
      {
        libelle: 'Inclusion numérique des jeunes',
        indicateurs: [
          "Taux d'accès des jeunes à l'internet haut débit",
          'Taux de jeunes engagés dans une formation certifiante ou diplômante dans le numérique',
          "Nombre d'ingénieurs formés dans le domaine informatique",
        ],
      },
      {
        libelle: 'Accès aux services sociaux de base',
        indicateurs: [
          'Taux de bancarisation des jeunes',
          "Taux de jeunes dans l'emploi informel",
          "Taux de jeunes propriétaires d'un actif immobilier",
        ],
      },
      {
        libelle: 'Vulnérabilité sociale des jeunes',
        indicateurs: [
          "Taux d'émigration illégale des jeunes",
          'Taux de délinquance/criminalité',
          'Proportion de jeunes incarcérés',
          "Taux d'échec scolaire",
          'Taux de décrochage scolaire',
        ],
      },
    ],
  },
  {
    libelle: 'Droit',
    criteres: [
      {
        libelle: 'Accès à la justice',
        indicateurs: [
          'Nombre de juridictions par habitant',
          'Nombre de professionnels de droit par habitant',
          "Taux d'accès des non-juristes/citoyens à l'information juridique",
          'Nombre de personnes formées à la chose juridique',
        ],
      },
      {
        libelle: "Effectivité de l'application du droit",
        indicateurs: [
          'Nombre de décisions prises en tenant compte des us et coutumes',
          'Nombre de recours après une décision de justice',
          "Indice d'état de droit",
        ],
      },
      {
        libelle: 'Confiance des citoyens dans la justice',
        indicateurs: [
          "Nombre de saisines de la justice en matière d'inégalités entre hommes et femmes",
          'Nombre de plaintes déposées dans les commissariats',
        ],
      },
      {
        libelle: "Promotion et protection des droits et de l'égalité",
        indicateurs: [
          'Nombre de journalistes incarcérés',
          "Nombre de lois adoptées en faveur de l'égalité hommes-femmes",
        ],
      },
    ],
  },
  {
    libelle: 'Politique',
    criteres: [
      {
        libelle: 'Confiance dans les institutions et acteurs politiques',
        indicateurs: [
          "Taux d'inscription sur la liste électorale",
          'Taux de participation aux élections générales',
          'Taux de participation aux élections locales',
        ],
      },
      {
        libelle: 'Participation politique des citoyens',
        indicateurs: [
          'Nombre de nouveaux adhérents dans les partis politiques',
          "Taux des partis de l'opposition à l'hémicycle",
          "Taux des partis de l'opposition dans le gouvernement",
        ],
      },
      {
        libelle: 'Qualité de la gouvernance publique',
        indicateurs: [
          "Nombre d'institutions chargées de la bonne gouvernance et des contre-pouvoirs",
          'Nombre de cas de fraudes électorales signalées',
          'Nombre de cas de fraudes électorales détectés et traités par les institutions',
          'Nombre de projets initiés en faveur des couches défavorisées',
          "Taux d'exécution du budget national",
        ],
      },
      {
        libelle: "Respect de l'État de droit",
        indicateurs: [
          'Nombre de manifestations syndicales encadrées',
          'Nombre de manifestations sociales et politiques encadrées',
        ],
      },
      {
        libelle: 'Connaissance du système électoral',
        indicateurs: [
          'Taux de bulletins nuls lors des élections',
          "Nombre d'acteurs politiques formés sur le processus électoral",
          'Nombre de citoyens sensibilisés sur le processus électoral',
        ],
      },
    ],
  },
  {
    libelle: 'Société et Vivant',
    criteres: [
      {
        libelle: 'Accès aux besoins essentiels',
        indicateurs: [
          'Espérance de vie',
          'Indice du bonheur des populations',
          'Nombre de repas consommés par jour',
          'Coût moyen de location des appartements de 3 pièces',
          'Coût moyen des produits alimentaires de base',
          "Taux d'électrification",
          "Coût du kWh de l'électricité",
          "Coût du m³ de l'eau",
        ],
      },
      {
        libelle: 'État de santé des populations',
        indicateurs: [
          'Nombre de services sanitaires de base',
          'Nombre de professionnels de santé par habitant',
          'Taux de suicide des populations en zones urbaines',
          'Nombre de décès à la naissance pour 1 000 habitants',
          'Nombre de personnes couvertes par une assurance maladie',
        ],
      },
      {
        libelle: 'Accès au logement',
        indicateurs: [
          'Prix de vente moyen des logements',
          'Nombre de logements sociaux créés',
          'Nombre de bidonvilles par ville',
        ],
      },
      {
        libelle: "Protection de l'environnement et écologie",
        indicateurs: [
          "Taux d'empreinte écologique",
          'Nombre de réserves et parcs nationaux',
          'Nombre de lois prises en faveur de la protection de l’environnement',
        ],
      },
      {
        libelle: 'Interaction société-environnement',
        indicateurs: [
          'Taux de pollution',
          "Taux d'empreinte carbone",
          'Taux de reboisement',
          'Nombre de lois prises en faveur de la gestion des déchets industriels et ménagers',
        ],
      },
    ],
  },
];

async function seed(): Promise<void> {
  await dataSource.initialize();
  const thematiqueRepo = dataSource.getRepository(Thematique);
  const critereRepo = dataSource.getRepository(Critere);
  const indicateurRepo = dataSource.getRepository(Indicateur);

  let thematiquesCreees = 0;
  let criteresCrees = 0;
  let indicateursCrees = 0;

  for (const blocThematique of REFERENTIEL) {
    // Thématique : créée seulement si absente (idempotence)
    let thematique = await thematiqueRepo.findOneBy({
      libelle: blocThematique.libelle,
    });
    if (!thematique) {
      thematique = await thematiqueRepo.save(
        thematiqueRepo.create({ libelle: blocThematique.libelle }),
      );
      thematiquesCreees++;
    }

    for (const blocCritere of blocThematique.criteres) {
      let critere = await critereRepo.findOne({
        where: {
          libelle: blocCritere.libelle,
          thematique: { id: thematique.id },
        },
      });
      if (!critere) {
        critere = await critereRepo.save(
          critereRepo.create({ libelle: blocCritere.libelle, thematique }),
        );
        criteresCrees++;
      }

      for (const libelleIndicateur of blocCritere.indicateurs) {
        const existe = await indicateurRepo.findOne({
          where: { libelle: libelleIndicateur, critere: { id: critere.id } },
        });
        if (!existe) {
          await indicateurRepo.save(
            indicateurRepo.create({ libelle: libelleIndicateur, critere }),
          );
          indicateursCrees++;
        }
      }
    }
  }

  console.log(
    `Seed référentiel terminé : ${thematiquesCreees} thématique(s), ` +
      `${criteresCrees} critère(s), ${indicateursCrees} indicateur(s) créés ` +
      `(déjà présents : ignorés).`,
  );
  await dataSource.destroy();
}

seed().catch((erreur) => {
  console.error('Échec du seed référentiel :', erreur);
  process.exit(1);
});
