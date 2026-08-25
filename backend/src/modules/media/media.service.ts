import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as Minio from 'minio';
import * as path from 'path';

/** Types de fichiers acceptés (contenus du feed, replays, audio) */
const TYPES_AUTORISES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'application/pdf',
]);

/** Taille maximale : 200 Mo (vidéos compressées pour mobile, CDC §6.2) */
export const TAILLE_MAX_OCTETS = 200 * 1024 * 1024;

export interface FichierUploade {
  /**
   * URL à enregistrer sur le contenu (urlMedia, urlReplay…). RELATIVE
   * (`/media/f/<clé>`) : le backend streame lui-même les fichiers, si bien
   * que les médias suivent l'adresse de l'API quel que soit le réseau
   * (démo en salle, Wi-Fi de la maison…) — plus aucune IP figée en base.
   */
  url: string;
  cle: string;
  type: string;
  taille: number;
}

/** Flux renvoyé par {@link MediaService.telecharger} pour le streaming HTTP. */
export interface FluxMedia {
  flux: NodeJS.ReadableStream;
  type: string;
  /** Taille totale de l'objet (en-tête Content-Length / Content-Range) */
  taille: number;
  /** Renseignés pour une réponse partielle 206 (lecture vidéo avec seek) */
  debut?: number;
  fin?: number;
}

/**
 * Stockage média S3-compatible (MediaService du socle transverse, CDC §3.0).
 * En dev : MinIO (docker-compose). En production : n'importe quel S3 —
 * seules les variables S3_* du .env changent.
 *
 * Dégradable : sans configuration S3, l'upload renvoie une 503 explicite,
 * tout le reste de l'application fonctionne.
 */
@Injectable()
export class MediaService implements OnModuleInit {
  private readonly logger = new Logger(MediaService.name);
  private client: Minio.Client | null = null;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = configService.get<string>('S3_BUCKET', 'algodemo-media');
  }

  async onModuleInit(): Promise<void> {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const accessKey = this.configService.get<string>('S3_ACCESS_KEY');
    const secretKey = this.configService.get<string>('S3_SECRET_KEY');
    if (!endpoint || !accessKey || !secretKey) {
      this.logger.warn(
        'Stockage média non configuré (S3_ENDPOINT/S3_ACCESS_KEY/S3_SECRET_KEY absents) — upload indisponible.',
      );
      return;
    }

    this.client = new Minio.Client({
      endPoint: endpoint,
      port: this.configService.get<number>('S3_PORT', 9000),
      useSSL: this.configService.get<string>('S3_USE_SSL', 'false') === 'true',
      accessKey,
      secretKey,
    });

    // Crée le bucket au premier démarrage + politique de lecture publique
    // (les médias publiés sont streamés directement par les clients mobiles).
    try {
      const existe = await this.client.bucketExists(this.bucket);
      if (!existe) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Bucket « ${this.bucket} » créé`);
      }
      await this.client.setBucketPolicy(
        this.bucket,
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        }),
      );
      this.logger.log(
        `Stockage média opérationnel : ${endpoint}:${this.configService.get('S3_PORT', 9000)} / ${this.bucket}`,
      );
    } catch (e) {
      this.logger.error(
        `Stockage média injoignable (${endpoint}) — upload indisponible : ${e instanceof Error ? e.message : String(e)}`,
      );
      this.client = null;
    }
  }

  get estConfigure(): boolean {
    return this.client !== null;
  }

  /** Upload d'un fichier (image/vidéo/audio/pdf) → URL publique */
  async uploader(fichier: Express.Multer.File): Promise<FichierUploade> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Le stockage média n’est pas configuré sur ce serveur',
      );
    }
    if (!TYPES_AUTORISES.has(fichier.mimetype)) {
      throw new BadRequestException(
        `Type de fichier non autorisé (${fichier.mimetype}). Acceptés : images, vidéos MP4/WebM, audio, PDF.`,
      );
    }
    if (fichier.size > TAILLE_MAX_OCTETS) {
      throw new BadRequestException(
        `Fichier trop volumineux (max ${TAILLE_MAX_OCTETS / 1024 / 1024} Mo)`,
      );
    }

    // Clé unique et datée : 2026/07/uuid.ext (tri et ménage faciles)
    const maintenant = new Date();
    const extension = path.extname(fichier.originalname).toLowerCase() || '';
    const cle = `${maintenant.getFullYear()}/${String(maintenant.getMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}${extension}`;

    await this.client.putObject(this.bucket, cle, fichier.buffer, fichier.size, {
      'Content-Type': fichier.mimetype,
    });

    return {
      url: `/media/f/${cle}`,
      cle,
      type: fichier.mimetype,
      taille: fichier.size,
    };
  }

  /**
   * Ouvre un flux de lecture sur un objet du bucket, avec prise en charge
   * des requêtes Range (indispensable au seek des lecteurs vidéo mobiles).
   * Renvoie null si l'objet n'existe pas.
   */
  async telecharger(cle: string, range?: string): Promise<FluxMedia | null> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Le stockage média n’est pas configuré sur ce serveur',
      );
    }

    let stat: Minio.BucketItemStat;
    try {
      stat = await this.client.statObject(this.bucket, cle);
    } catch {
      return null;
    }
    const type =
      (stat.metaData?.['content-type'] as string | undefined) ??
      'application/octet-stream';

    // Range « bytes=début-fin » (fin ouverte ou suffixe « -N » acceptés)
    const correspondance = range
      ? /^bytes=(\d*)-(\d*)$/.exec(range.trim())
      : null;
    if (correspondance && (correspondance[1] || correspondance[2])) {
      const debut = correspondance[1]
        ? Number(correspondance[1])
        : Math.max(0, stat.size - Number(correspondance[2]));
      const fin = correspondance[1] && correspondance[2]
        ? Math.min(Number(correspondance[2]), stat.size - 1)
        : stat.size - 1;
      if (debut <= fin && debut < stat.size) {
        const flux = await this.client.getPartialObject(
          this.bucket,
          cle,
          debut,
          fin - debut + 1,
        );
        return { flux, type, taille: stat.size, debut, fin };
      }
    }

    const flux = await this.client.getObject(this.bucket, cle);
    return { flux, type, taille: stat.size };
  }
}
