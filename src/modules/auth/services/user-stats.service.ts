import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/** Activité citoyenne d'un compte (§9.3 — fiche compte du back-office). */
export interface StatistiquesUtilisateur {
  /** Avis déposés, tous statuts de modération confondus. */
  avisDeposes: number;
  /** Avis effectivement publiés après modération. */
  avisApprouves: number;
  /**
   * Consultations auxquelles le compte a participé (un vote par consultation).
   * Le choix exprimé n'est pas connaissable — voir le secret du vote.
   */
  votesConsultations: number;
  /** Votes sur les affirmations soumises pendant les débats en direct. */
  votesDebats: number;
  /** Débats rejoints. */
  debatsRejoints: number;
  /** Prises de parole transcrites (intervenants uniquement). */
  prisesDeParole: number;
  /** Signalements émis, sur le feed comme en débat. */
  signalementsEmis: number;
}

/**
 * Compteurs d'activité par utilisateur.
 *
 * Les tables comptées appartiennent à d'autres modules (Consultations, Débats,
 * Feed), volontairement découplés : ils ne référencent l'utilisateur que par
 * son identifiant, sans relation TypeORM. On interroge donc la source de
 * données directement, plutôt que d'introduire ici des dépendances de module
 * qui créeraient des cycles — même approche que le tableau de bord.
 *
 * Chaque compte est indépendant : une table vide (module non encore alimenté)
 * renvoie zéro, jamais une erreur.
 */
@Injectable()
export class UserStatsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async statistiquesUtilisateur(
    userId: string,
  ): Promise<StatistiquesUtilisateur> {
    const [
      avisDeposes,
      avisApprouves,
      votesConsultations,
      votesDebats,
      debatsRejoints,
      prisesDeParole,
      signalementsFeed,
      signalementsDebat,
    ] = await Promise.all([
      this.compter('avis', 'auteur_id', userId),
      this.compter('avis', 'auteur_id', userId, "statut_moderation = 'APPROUVE'"),
      // Émargement, pas bulletin : on compte les participations, jamais les
      // choix exprimés (secret du vote, CDC §6.3).
      this.compter('participations_consultation', 'user_id', userId),
      this.compter('votes_affirmation', '"userId"', userId),
      this.compter('participations_debat', '"userId"', userId),
      this.compter('transcription_segments', '"userId"', userId),
      this.compter('signalements', 'signale_par', userId),
      this.compter('signalements_debat', '"userId"', userId),
    ]);

    return {
      avisDeposes,
      avisApprouves,
      votesConsultations,
      votesDebats,
      debatsRejoints,
      prisesDeParole,
      // Le citoyen ne distingue pas les deux surfaces : un signalement est un
      // signalement, qu'il vise le feed ou un débat en direct.
      signalementsEmis: signalementsFeed + signalementsDebat,
    };
  }

  /**
   * Historique d'activité chronologique du compte — les 100 événements les
   * plus récents, toutes surfaces confondues. Même règle que partout : pour
   * les consultations on montre l'ÉMARGEMENT (« vous avez participé »),
   * jamais le choix exprimé (secret du vote, CDC §6.3).
   */
  async historiqueActivite(
    userId: string,
  ): Promise<{ type: string; libelle: string; date: string }[]> {
    // UNION de littéraux du code — seul $1 (userId) est paramétré.
    const lignes = await this.dataSource.query<
      { type: string; libelle: string; date: string }[]
    >(
      `
      SELECT * FROM (
        SELECT 'AVIS' AS type, LEFT(a.texte, 120) AS libelle, a.cree_le AS date
          FROM avis a WHERE a.auteur_id = $1
        UNION ALL
        SELECT 'VOTE_CONSULTATION', c.titre, p.participe_le
          FROM participations_consultation p
          JOIN consultations c ON c.id = p."consultationId"
          WHERE p.user_id = $1
        UNION ALL
        SELECT 'DEBAT_REJOINT', d.titre, pd."rejointLe"
          FROM participations_debat pd
          JOIN debats d ON d.id = pd."debatId"
          WHERE pd."userId" = $1
        UNION ALL
        SELECT 'VOTE_DEBAT', LEFT(af.texte, 120), v."voteLe"
          FROM votes_affirmation v
          JOIN affirmations_debat af ON af.id = v."affirmationId"
          WHERE v."userId" = $1
        UNION ALL
        SELECT 'MESSAGE_DEBAT', LEFT(m.texte, 120), m."creeLe"
          FROM messages_debat m
          WHERE m."auteurId" = $1 AND m."supprimeLe" IS NULL
        UNION ALL
        SELECT 'COMMENTAIRE', LEFT(cc.texte, 120), cc.cree_le
          FROM commentaires_contenu cc WHERE cc.auteur_id = $1
        UNION ALL
        SELECT 'SIGNALEMENT_TERRAIN', LEFT(sc.description, 120), sc."creeLe"
          FROM signalements_citoyens sc WHERE sc."auteurId" = $1
        UNION ALL
        SELECT 'SIGNALEMENT_CONTENU', s.motif, s.cree_le
          FROM signalements s WHERE s.signale_par = $1
        UNION ALL
        SELECT 'PRISE_PAROLE', d.titre, dp."majLe"
          FROM demandes_parole dp
          JOIN debats d ON d.id = dp."debatId"
          WHERE dp."userId" = $1 AND dp.statut IN ('ACCORDEE', 'TERMINEE')
      ) activite
      ORDER BY date DESC
      LIMIT 100
      `,
      [userId],
    );
    return lignes;
  }

  /**
   * Export complet des données du compte (droit à la portabilité, RGPD
   * art. 20) : le profil et toutes les contributions, en clair, SAUF les
   * choix de vote des consultations — le serveur lui-même ne sait pas les
   * relier au compte (secret du vote), et l'export le dit explicitement.
   */
  async exportDonnees(userId: string): Promise<Record<string, unknown>> {
    const [profils, avis, consultations, debats, messages, commentaires, signalementsTerrain, signalementsContenu, prisesParole] =
      await Promise.all([
        this.dataSource.query<Record<string, unknown>[]>(
          `SELECT email, prenom, nom, telephone, role, email_verifie, compte_valide,
                  consentement_notifications, politique_confidentialite_acceptee_le, cree_le
             FROM users WHERE id = $1`,
          [userId],
        ),
        this.dataSource.query(
          `SELECT a.texte, a.statut_moderation, a.cree_le, t.libelle AS thematique
             FROM avis a LEFT JOIN thematiques t ON t.id = a."thematiqueId"
            WHERE a.auteur_id = $1 ORDER BY a.cree_le`,
          [userId],
        ),
        this.dataSource.query(
          `SELECT c.titre, c.type, p.participe_le
             FROM participations_consultation p
             JOIN consultations c ON c.id = p."consultationId"
            WHERE p.user_id = $1 ORDER BY p.participe_le`,
          [userId],
        ),
        this.dataSource.query(
          `SELECT d.titre, pd.role, pd."rejointLe"
             FROM participations_debat pd JOIN debats d ON d.id = pd."debatId"
            WHERE pd."userId" = $1 ORDER BY pd."rejointLe"`,
          [userId],
        ),
        this.dataSource.query(
          `SELECT m.texte, m."creeLe", d.titre AS debat
             FROM messages_debat m JOIN debats d ON d.id = m."debatId"
            WHERE m."auteurId" = $1 AND m."supprimeLe" IS NULL ORDER BY m."creeLe"`,
          [userId],
        ),
        this.dataSource.query(
          `SELECT cc.texte, cc.cree_le, co.titre AS contenu
             FROM commentaires_contenu cc
             LEFT JOIN contenus co ON co.id = cc."contenuId"
            WHERE cc.auteur_id = $1 ORDER BY cc.cree_le`,
          [userId],
        ),
        this.dataSource.query(
          `SELECT categorie, description, adresse, statut, "creeLe"
             FROM signalements_citoyens WHERE "auteurId" = $1 ORDER BY "creeLe"`,
          [userId],
        ),
        this.dataSource.query(
          `SELECT motif, statut, cree_le FROM signalements
            WHERE signale_par = $1 ORDER BY cree_le`,
          [userId],
        ),
        this.dataSource.query(
          `SELECT d.titre AS debat, dp.statut, dp."creeLe", dp."majLe"
             FROM demandes_parole dp JOIN debats d ON d.id = dp."debatId"
            WHERE dp."userId" = $1 ORDER BY dp."creeLe"`,
          [userId],
        ),
      ]);

    return {
      exporteLe: new Date().toISOString(),
      plateforme: 'AlgoDémo — Forum Ivoirien de la Démocratie',
      noteSecretDuVote:
        "Les choix exprimés lors des consultations n'apparaissent pas : les bulletins sont anonymes dès l'enregistrement, le serveur lui-même ne peut pas les relier à votre compte.",
      profil: profils[0] ?? null,
      avis,
      participationsConsultations: consultations,
      debatsRejoints: debats,
      messagesDebat: messages,
      commentaires,
      signalementsTerrain,
      signalementsContenus: signalementsContenu,
      prisesDeParole: prisesParole,
      statistiques: await this.statistiquesUtilisateur(userId),
    };
  }

  /**
   * Compte les lignes d'une table pour un utilisateur.
   *
   * `table`, `colonne` et `conditionSupplementaire` sont des littéraux du code
   * — jamais des entrées utilisateur. Seul `userId` est paramétré, donc hors
   * de portée d'une injection SQL.
   */
  private async compter(
    table: string,
    colonne: string,
    userId: string,
    conditionSupplementaire?: string,
  ): Promise<number> {
    const filtre = conditionSupplementaire ? ` AND ${conditionSupplementaire}` : '';
    const lignes = await this.dataSource.query<{ nombre: string }[]>(
      `SELECT COUNT(*)::int AS nombre FROM "${table}" WHERE ${colonne} = $1${filtre}`,
      [userId],
    );
    return Number(lignes[0]?.nombre ?? 0);
  }
}
