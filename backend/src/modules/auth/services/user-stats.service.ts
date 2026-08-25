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
