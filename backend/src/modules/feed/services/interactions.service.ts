import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CommentaireContenu } from '../entities/commentaire-contenu.entity';
import { Contenu } from '../entities/contenu.entity';
import { ReactionCommentaire } from '../entities/reaction-commentaire.entity';
import { ReactionContenu } from '../entities/reaction-contenu.entity';

/** Commentaire tel que servi au mobile — le nom est résolu, jamais stocké. */
export interface CommentairePublic {
  id: string;
  texte: string;
  /** « Prénom N. » — ou « Citoyen » si le compte a été anonymisé. */
  auteur: string;
  /** Commentaire racine auquel celui-ci répond (fil à un niveau). */
  parentId: string | null;
  /** Nombre de « j'aime » sur ce commentaire. */
  nbAimes: number;
  creeLe: Date;
}

/**
 * Interactions citoyennes sur le feed (« j'aime », commentaires — §6.2).
 *
 * Les noms d'auteurs sont résolus à CHAQUE lecture depuis la table `users`
 * (requête directe : modules découplés par IDs). C'est ce qui rend
 * l'anonymisation (RG-USR-07) rétroactive : un compte effacé voit tous ses
 * commentaires passés signés « Citoyen », sans migration.
 */
@Injectable()
export class InteractionsService {
  constructor(
    @InjectRepository(ReactionContenu)
    private readonly reactionRepo: Repository<ReactionContenu>,
    @InjectRepository(CommentaireContenu)
    private readonly commentaireRepo: Repository<CommentaireContenu>,
    @InjectRepository(ReactionCommentaire)
    private readonly reactionCommentaireRepo: Repository<ReactionCommentaire>,
    @InjectRepository(Contenu)
    private readonly contenuRepo: Repository<Contenu>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** Bascule « j'aime » : liker un contenu déjà aimé retire la réaction. */
  async basculerReaction(
    contenuId: string,
    userId: string,
  ): Promise<{ aime: boolean; total: number }> {
    await this.contenuExiste(contenuId);

    const existante = await this.reactionRepo.findOne({
      where: { userId, contenu: { id: contenuId } },
    });
    if (existante) {
      await this.reactionRepo.remove(existante);
    } else {
      await this.reactionRepo.save(
        this.reactionRepo.create({ userId, contenu: { id: contenuId } as Contenu }),
      );
    }

    const total = await this.reactionRepo.count({
      where: { contenu: { id: contenuId } },
    });
    return { aime: !existante, total };
  }

  /** Contenus aimés par l'utilisateur — le mobile s'en sert pour peindre les cœurs. */
  async reactionsDe(userId: string): Promise<string[]> {
    const reactions = await this.reactionRepo.find({
      where: { userId },
      relations: { contenu: true },
      select: { id: true, contenu: { id: true } },
    });
    return reactions.map((r) => r.contenu.id);
  }

  async listerCommentaires(contenuId: string): Promise<CommentairePublic[]> {
    await this.contenuExiste(contenuId);
    const commentaires = await this.commentaireRepo.find({
      where: { contenu: { id: contenuId } },
      order: { creeLe: 'ASC' },
    });
    const [noms, aimes] = await Promise.all([
      this.nomsPublics([...new Set(commentaires.map((c) => c.auteurId))]),
      this.compteursAimes(commentaires.map((c) => c.id)),
    ]);
    return commentaires.map((c) => ({
      id: c.id,
      texte: c.texte,
      auteur: noms.get(c.auteurId) ?? 'Citoyen',
      parentId: c.parentId,
      nbAimes: aimes.get(c.id) ?? 0,
      creeLe: c.creeLe,
    }));
  }

  /** Nombre de « j'aime » par commentaire, en une seule requête. */
  private async compteursAimes(
    commentaireIds: string[],
  ): Promise<Map<string, number>> {
    if (commentaireIds.length === 0) return new Map();
    const lignes = await this.dataSource.query<
      { commentaireId: string; n: number }[]
    >(
      `SELECT "commentaireId", COUNT(*)::int AS n
       FROM reactions_commentaire
       WHERE "commentaireId" = ANY($1::uuid[])
       GROUP BY "commentaireId"`,
      [commentaireIds],
    );
    return new Map(lignes.map((l) => [l.commentaireId, Number(l.n)]));
  }

  /** Bascule « j'aime » sur un commentaire — même modèle que les contenus. */
  async basculerReactionCommentaire(
    commentaireId: string,
    userId: string,
  ): Promise<{ aime: boolean; total: number }> {
    const commentaire = await this.commentaireRepo.findOneBy({
      id: commentaireId,
    });
    if (!commentaire) {
      throw new NotFoundException(`Commentaire ${commentaireId} introuvable`);
    }

    const existante = await this.reactionCommentaireRepo.findOne({
      where: { userId, commentaire: { id: commentaireId } },
    });
    if (existante) {
      await this.reactionCommentaireRepo.remove(existante);
    } else {
      await this.reactionCommentaireRepo.save(
        this.reactionCommentaireRepo.create({
          userId,
          commentaire: { id: commentaireId } as CommentaireContenu,
        }),
      );
    }

    const total = await this.reactionCommentaireRepo.count({
      where: { commentaire: { id: commentaireId } },
    });
    return { aime: !existante, total };
  }

  /**
   * Les commentaires de CE contenu que l'utilisateur a aimés — le mobile
   * s'en sert pour peindre les cœurs à l'ouverture de la feuille.
   */
  async reactionsCommentairesDe(
    userId: string,
    contenuId: string,
  ): Promise<string[]> {
    const lignes = await this.dataSource.query<{ commentaireId: string }[]>(
      `SELECT r."commentaireId"
       FROM reactions_commentaire r
       JOIN commentaires_contenu c ON c.id = r."commentaireId"
       WHERE r.user_id = $1 AND c."contenuId" = $2`,
      [userId, contenuId],
    );
    return lignes.map((l) => l.commentaireId);
  }

  async commenter(
    contenuId: string,
    auteurId: string,
    texte: string,
    parentId?: string,
  ): Promise<CommentairePublic> {
    // Réponse : le parent doit exister et appartenir au même contenu. Fil à
    // UN niveau — répondre à une réponse rattache au commentaire racine.
    let parentRacine: string | null = null;
    if (parentId) {
      const parent = await this.commentaireRepo.findOne({
        where: { id: parentId },
        relations: { contenu: true },
      });
      if (!parent || parent.contenu.id !== contenuId) {
        throw new BadRequestException(
          'Le commentaire auquel vous répondez est introuvable sur ce contenu',
        );
      }
      parentRacine = parent.parentId ?? parent.id;
    }
    await this.contenuExiste(contenuId);
    const commentaire = await this.commentaireRepo.save(
      this.commentaireRepo.create({
        auteurId,
        texte,
        parentId: parentRacine,
        contenu: { id: contenuId } as Contenu,
      }),
    );
    const noms = await this.nomsPublics([auteurId]);
    return {
      id: commentaire.id,
      texte: commentaire.texte,
      auteur: noms.get(auteurId) ?? 'Citoyen',
      parentId: commentaire.parentId,
      nbAimes: 0,
      creeLe: commentaire.creeLe,
    };
  }

  /** Modération a posteriori — réservée aux gestionnaires (contrôleur). */
  async supprimerCommentaire(id: string): Promise<void> {
    const commentaire = await this.commentaireRepo.findOneBy({ id });
    if (!commentaire) {
      throw new NotFoundException(`Commentaire ${id} introuvable`);
    }
    await this.commentaireRepo.remove(commentaire);
  }

  /**
   * Noms d'affichage publics : « Prénom N. » — jamais le nom complet dans un
   * espace public, et « Citoyen » pour un compte anonymisé.
   */
  private async nomsPublics(userIds: string[]): Promise<Map<string, string>> {
    if (userIds.length === 0) return new Map();
    const lignes = await this.dataSource.query<
      { id: string; prenom: string; nom: string; anonymise: boolean }[]
    >(
      `SELECT id, prenom, nom, anonymise FROM users WHERE id = ANY($1::uuid[])`,
      [userIds],
    );
    return new Map(
      lignes
        .filter((u) => !u.anonymise)
        .map((u) => [
          u.id,
          `${u.prenom} ${u.nom ? `${u.nom[0].toUpperCase()}.` : ''}`.trim(),
        ]),
    );
  }

  private async contenuExiste(id: string): Promise<void> {
    const existe = await this.contenuRepo.existsBy({ id });
    if (!existe) {
      throw new NotFoundException(`Contenu ${id} introuvable`);
    }
  }
}
