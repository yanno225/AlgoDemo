/**
 * Seed de DÉMONSTRATION de la Fiche-pays (Côte d'Ivoire, phase pilote).
 *
 * Crée quelques indicateurs (exemples réels du CDC §5) et des valeurs
 * FICTIVES pour que la fiche-pays affiche quelque chose. À terme, ces
 * données seront produites par le pipeline scraping → IA → validation admin.
 *
 * Idempotent : ré-exécutable sans créer de doublons.
 * Lancement : npm run seed (enchaîné après le seed du référentiel)
 */
import dataSource from '../../config/typeorm-datasource';
import { ValeurIndicateur } from '../../modules/fiche-pays/entities/valeur-indicateur.entity';
import { Critere } from '../../modules/referentiel/entities/critere.entity';
import { Indicateur } from '../../modules/referentiel/entities/indicateur.entity';

const PAYS = "Côte d'Ivoire";
const SOURCE_DEMO = 'Données de démonstration — à remplacer par les données réelles';

/** critere = libellé exact du critère seedé ; valeurs par année */
const DEMO: {
  critere: string;
  indicateur: string;
  valeurs: { annee: number; valeur: number }[];
}[] = [
  {
    critere: 'Violences basées sur le genre',
    indicateur: 'Nombre de cas de VBG signalés',
    valeurs: [
      { annee: 2022, valeur: 5240 },
      { annee: 2023, valeur: 4890 },
      { annee: 2024, valeur: 4210 },
    ],
  },
  {
    critere: "Accès à l'éducation et à la formation des groupes vulnérables",
    indicateur: 'Taux de scolarisation des jeunes filles',
    valeurs: [
      { annee: 2022, valeur: 61.5 },
      { annee: 2023, valeur: 64.2 },
      { annee: 2024, valeur: 66.8 },
    ],
  },
  {
    critere: 'Autonomisation socio-économique des jeunes',
    indicateur: 'Taux de chômage chez les jeunes',
    valeurs: [
      { annee: 2022, valeur: 32.1 },
      { annee: 2023, valeur: 30.4 },
      { annee: 2024, valeur: 29.0 },
    ],
  },
  {
    critere: 'Confiance dans les institutions et acteurs politiques',
    indicateur: 'Taux de participation aux élections générales',
    valeurs: [
      { annee: 2020, valeur: 53.9 },
      { annee: 2023, valeur: 44.3 },
    ],
  },
  {
    critere: 'Accès aux besoins essentiels',
    indicateur: "Taux d'électrification",
    valeurs: [
      { annee: 2022, valeur: 71.0 },
      { annee: 2023, valeur: 76.4 },
      { annee: 2024, valeur: 82.0 },
    ],
  },
];

async function seed(): Promise<void> {
  await dataSource.initialize();
  const critereRepo = dataSource.getRepository(Critere);
  const indicateurRepo = dataSource.getRepository(Indicateur);
  const valeurRepo = dataSource.getRepository(ValeurIndicateur);

  let indicateursCrees = 0;
  let valeursCreees = 0;

  for (const bloc of DEMO) {
    const critere = await critereRepo.findOneBy({ libelle: bloc.critere });
    if (!critere) {
      console.warn(
        `⚠ Critère "${bloc.critere}" introuvable — lancer d'abord le seed du référentiel`,
      );
      continue;
    }

    // Indicateur : créé seulement si absent (idempotence)
    let indicateur = await indicateurRepo.findOne({
      where: { libelle: bloc.indicateur, critere: { id: critere.id } },
    });
    if (!indicateur) {
      indicateur = await indicateurRepo.save(
        indicateurRepo.create({ libelle: bloc.indicateur, critere }),
      );
      indicateursCrees++;
    }

    for (const { annee, valeur } of bloc.valeurs) {
      const dateMesure = `${annee}-01-01`;
      const existe = await valeurRepo.findOne({
        where: {
          indicateur: { id: indicateur.id },
          paysOuZone: PAYS,
          dateMesure,
        },
      });
      if (!existe) {
        await valeurRepo.save(
          valeurRepo.create({
            valeur,
            dateMesure,
            paysOuZone: PAYS,
            source: SOURCE_DEMO,
            indicateur,
          }),
        );
        valeursCreees++;
      }
    }
  }

  console.log(
    `Seed fiche-pays terminé : ${indicateursCrees} indicateur(s) et ${valeursCreees} valeur(s) créés ` +
      `(déjà présents : ignorés).`,
  );
  await dataSource.destroy();
}

seed().catch((erreur) => {
  console.error('Échec du seed fiche-pays :', erreur);
  process.exit(1);
});
