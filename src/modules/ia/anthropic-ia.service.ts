import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  DonneesReformulation,
  DonneesResumeDebat,
  DonneesSynthese,
  DonneesVerification,
  FichierAAnalyser,
  IaService,
  IndicateurConnu,
  PropositionValeur,
  ResultatVerification,
} from './ia-service.interface';

/**
 * Implémentation du service IA via l'API Claude (Anthropic) — le fournisseur
 * cible du projet (plan d'octobre, phase 2 : service de collecte).
 * Configuration (.env) : ANTHROPIC_API_KEY · ANTHROPIC_MODEL.
 *
 * Choisie automatiquement (prioritaire sur Mistral et le stub) dès qu'une clé
 * ANTHROPIC_API_KEY est présente, via la factory de ia.module.ts.
 *
 * Garde-fous (mêmes règles que les autres implémentations) :
 *  - anti-hallucination : l'IA ne s'appuie QUE sur les données fournies ;
 *  - extraction sur liste FERMÉE d'indicateurs, avec citation verbatim ;
 *  - tout texte produit est un BROUILLON soumis à validation humaine.
 */
@Injectable()
export class AnthropicIaService implements IaService {
  private readonly logger = new Logger(AnthropicIaService.name);
  private readonly client: Anthropic;
  private readonly model: string;

  /** Longueur max du texte envoyé à l'extraction (maîtrise du coût en tokens) */
  private static readonly LIMITE_TEXTE = 30_000;

  constructor(configService: ConfigService) {
    this.client = new Anthropic({
      apiKey: configService.get<string>('ANTHROPIC_API_KEY', ''),
    });
    this.model = configService.get<string>('ANTHROPIC_MODEL', 'claude-opus-5');
  }

  async genererSyntheseThematique(donnees: DonneesSynthese): Promise<string> {
    const lignes = donnees.indicateurs
      .filter((i) => i.valeurs.length > 0)
      .map((i) => {
        const mesures = i.valeurs
          .map((v) => `${v.valeur} (${v.dateMesure.slice(0, 4)})`)
          .join(', ');
        return `- ${i.critere} › ${i.indicateur} : ${mesures}`;
      })
      .join('\n');

    return this.completer(
      "Tu es un analyste de la démocratie qui rédige des synthèses claires, neutres et vérifiables, en français, pour des citoyens de tous niveaux. N'invente aucun chiffre : appuie-toi uniquement sur les données fournies.",
      `Rédige une synthèse COURTE (3 à 4 phrases maximum) de la thématique « ${donnees.thematique} » ` +
        `pour ${donnees.paysOuZone}, à partir de ces indicateurs mesurés :\n${lignes || '(aucune donnée disponible)'}\n\n` +
        `Va à l'essentiel : la tendance principale et un ou deux chiffres marquants, sans jargon. ` +
        `Elle s'affiche sur un écran de téléphone — la concision prime. ` +
        `Réponds uniquement par la synthèse, sans préambule.`,
    );
  }

  async genererResumeDebat(donnees: DonneesResumeDebat): Promise<string> {
    const verbatim = donnees.transcription
      .map((s) => `${s.intervenant} : ${s.texte}`)
      .join('\n');
    const affirmations = donnees.affirmations
      .map((a) => {
        const total = a.valides + a.invalides;
        return `- « ${a.texte} » : ${a.valides} votes « vrai », ${a.invalides} votes « faux » (${total} votants)`;
      })
      .join('\n');

    return this.completer(
      'Tu résumes fidèlement un débat citoyen pour publication grand public, en français. ' +
        "Appuie-toi uniquement sur la transcription et les votes fournis : n'invente aucun propos, chiffre, nom ou fait absent de ces données. " +
        'Si la transcription est vide, ne rapporte que les affirmations soumises au vote et leurs résultats. Reste neutre, ne prends pas parti.',
      `Rédige le résumé d'un débat citoyen terminé (6 à 10 phrases si la matière le permet, moins sinon).\n` +
        `Titre : ${donnees.titre}\nThématique : ${donnees.thematique}\n` +
        (donnees.description ? `Contexte : ${donnees.description}\n` : '') +
        `\n--- TRANSCRIPTION (ce qui a été réellement dit) ---\n${verbatim || '(aucune transcription disponible)'}\n` +
        `\n--- AFFIRMATIONS SOUMISES AU VOTE ---\n${affirmations || '(aucune)'}\n\n` +
        `Restitue fidèlement les points échangés et, pour chaque affirmation, comment la salle l'a jugée. ` +
        `Réponds uniquement par le résumé, sans préambule.`,
    );
  }

  async extraireValeurs(
    texteBrut: string,
    indicateursConnus: IndicateurConnu[],
  ): Promise<PropositionValeur[]> {
    const liste = indicateursConnus
      .map((i) => `${i.id} = ${i.libelle}`)
      .join('\n');

    const reponse = await this.client.messages.create({
      model: this.model,
      max_tokens: 8192,
      system:
        "Tu extrais des valeurs chiffrées d'un texte et tu les rattaches à une liste FERMÉE d'indicateurs connus. " +
        "Tu ne crées jamais d'indicateur et tu n'inventes jamais de valeur : chaque proposition doit être appuyée par un passage exact du texte.",
      messages: [
        {
          role: 'user',
          content:
            `Indicateurs connus (id = libellé) :\n${liste}\n\n` +
            `Texte à analyser :\n"""${texteBrut.slice(0, AnthropicIaService.LIMITE_TEXTE)}"""\n\n` +
            `Extrais uniquement les indicateurs de la liste dont une valeur chiffrée apparaît clairement dans le texte. ` +
            `Pour chacun : la valeur, la date de mesure (AAAA-MM-JJ — si seule l'année est connue, AAAA-01-01), ` +
            `la source citée par le texte s'il en mentionne une, et "extrait" = la phrase EXACTE du texte (verbatim, ≤ 300 caractères) d'où la valeur est tirée. ` +
            `Liste vide si rien de fiable.`,
        },
      ],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              propositions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    indicateurId: { type: 'string' },
                    valeur: { type: 'number' },
                    dateMesure: {
                      type: 'string',
                      description: 'Date de mesure au format AAAA-MM-JJ',
                    },
                    source: {
                      type: 'string',
                      description:
                        'Source citée par le texte, ou chaîne vide si non mentionnée',
                    },
                    extrait: {
                      type: 'string',
                      description:
                        "Phrase exacte du texte (verbatim) d'où la valeur est tirée",
                    },
                  },
                  required: [
                    'indicateurId',
                    'valeur',
                    'dateMesure',
                    'source',
                    'extrait',
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ['propositions'],
            additionalProperties: false,
          },
        },
      },
    });

    if (reponse.stop_reason === 'refusal') {
      this.logger.warn("Extraction refusée par les classifieurs de sécurité");
      return [];
    }

    const texte = reponse.content.find((b) => b.type === 'text')?.text;
    if (!texte) return [];

    try {
      const brut = JSON.parse(texte) as { propositions?: unknown };
      if (!Array.isArray(brut.propositions)) return [];
      const idsConnus = new Set(indicateursConnus.map((i) => i.id));
      return brut.propositions
        .filter(
          (p): p is PropositionValeur =>
            typeof p === 'object' &&
            p !== null &&
            typeof (p as PropositionValeur).indicateurId === 'string' &&
            idsConnus.has((p as PropositionValeur).indicateurId) &&
            typeof (p as PropositionValeur).valeur === 'number',
        )
        .map((p) => ({
          indicateurId: p.indicateurId,
          valeur: p.valeur,
          dateMesure: p.dateMesure,
          source: p.source?.trim() || 'Extraction IA (à vérifier)',
          extrait:
            typeof p.extrait === 'string' && p.extrait.trim()
              ? p.extrait.slice(0, 500)
              : undefined,
        }));
    } catch (e) {
      this.logger.error(
        'Réponse Claude non parsable pour extraireValeurs',
        e instanceof Error ? e.message : String(e),
      );
      return [];
    }
  }

  async reformulerIndicateur(donnees: DonneesReformulation): Promise<string> {
    const sources = donnees.sources
      .map((s) => `- ${s.source} : ${s.valeur} (${s.annee})`)
      .join('\n');

    return this.completer(
      "Tu aides un administrateur à publier une donnée fiable pour des citoyens, en français. " +
        "À partir des valeurs rapportées par plusieurs sources, rédige UNE phrase claire et neutre " +
        "indiquant la valeur la plus fiable (privilégie la plus récente et la concordance des sources), " +
        "en citant la ou les sources. N'invente aucun chiffre : utilise uniquement les valeurs fournies.",
      `Indicateur : ${donnees.indicateur}\nCritère : ${donnees.critere}\n` +
        `Thématique : ${donnees.thematique}\nPays : ${donnees.paysOuZone}\n\n` +
        `Valeurs collectées :\n${sources}\n\n` +
        `Rédige la phrase de synthèse à soumettre à validation. Réponds uniquement par cette phrase.`,
    );
  }

  /**
   * Phase de recherche : le modèle interroge le web EN DIRECT, mais uniquement
   * sur les domaines de la liste blanche (CEI, ANSTAT, Banque mondiale…).
   * Retourne un compte-rendu textuel avec les URLs réellement consultées —
   * vide si la recherche n'apporte rien ou échoue (le verdict n'en dépend pas).
   */
  private async rechercherSurListeBlanche(
    affirmation: string,
    domaines: string[],
  ): Promise<string> {
    if (domaines.length === 0) return '';
    try {
      const reponse = await this.client.messages.create({
        model: this.model,
        max_tokens: 3000,
        system:
          'Tu vérifies des faits pour une plateforme démocratique dont le champ est STRICT : démocratie, gouvernance, élections, droits, justice, vie publique et société (genre, jeunesse, santé publique, environnement — les thématiques du référentiel), ainsi que la citoyenneté, la désinformation et l’éducation civique. ' +
          "AVANT toute recherche : si l'entrée est étrangère à ce champ (sport, célébrités, divertissement, vie privée…), ne fais AUCUNE recherche et réponds exactement HORS_SUJET, rien d'autre. " +
          "Si l'entrée est une QUESTION GÉNÉRALE du champ (définition, explication, « comment… », « pourquoi… ») plutôt qu'un fait chiffré à vérifier, ne cherche que si une source autorisée peut réellement l'éclairer — sinon dis en une phrase que la recherche n'est pas nécessaire. " +
          'Sinon : tu recherches UNIQUEMENT sur les domaines autorisés (imposés par l’outil). ' +
          'Rapporte ce que les sources disent réellement — chiffres, dates, URL exacte de chaque page utilisée. ' +
          "Si les recherches ne donnent rien d'utile, dis-le en une phrase.",
        messages: [
          {
            role: 'user',
            content:
              `Affirmation à vérifier :\n« ${affirmation} »\n\n` +
              `Recherche ce que les sources autorisées en disent, puis résume tes constats en citant pour chacun la source et son URL.`,
          },
        ],
        tools: [
          {
            type: 'web_search_20260209',
            name: 'web_search',
            max_uses: 5,
            // La liste blanche de la plateforme fait loi — le modèle ne peut
            // physiquement pas consulter un autre domaine.
            allowed_domains: domaines.slice(0, 40),
          } as Anthropic.Messages.ToolUnion,
        ],
      });
      if (reponse.stop_reason === 'refusal') return '';
      return reponse.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
    } catch (e) {
      this.logger.warn(
        `Recherche web indisponible pour la vérification : ${e instanceof Error ? e.message : String(e)}`,
      );
      return '';
    }
  }

  async verifierAffirmation(
    donnees: DonneesVerification,
  ): Promise<ResultatVerification> {
    // Phase 1 — recherche en direct sur la liste blanche (tolérante à l'échec).
    const rechercheWeb = await this.rechercherSurListeBlanche(
      donnees.affirmation,
      donnees.domainesAutorises,
    );

    // Garde de périmètre : l'assistant vérifie la vie démocratique et sociale,
    // pas les résultats sportifs ni la vie des célébrités. Décliné poliment,
    // sans dépenser l'appel de verdict.
    if (rechercheWeb.trim().toUpperCase().startsWith('HORS_SUJET')) {
      return {
        verdict: 'NON_VERIFIABLE',
        explication:
          "Cette question sort du champ de l'assistant, qui vérifie les affirmations liées à la démocratie, la gouvernance, les droits et la vie publique — les thématiques de la plateforme. Reformulez avec un sujet citoyen (élections, justice, services publics, société…) et je m'y attelle.",
        elements: [],
        references: [],
        sourcesWeb: [],
        eclairage: null,
      };
    }

    // Données et références sont numérotées : l'IA cite des INDEX, jamais du
    // texte libre — impossible d'inventer une source qui n'existe pas.
    const lignesDonnees = donnees.donnees
      .map(
        (d, index) =>
          `[D${index}] ${d.thematique} › ${d.critere} › ${d.indicateur} — ` +
          `${d.paysOuZone} : ${d.valeur} (${d.annee}, source : ${d.source})`,
      )
      .join('\n');
    const lignesReferences = donnees.references
      .map(
        (r, index) =>
          `[R${index}] « ${r.titre} » (${r.source}) : ${r.texte.slice(0, 400)}`,
      )
      .join('\n');

    const reponse = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system:
        "Tu es l'assistant citoyen d'une plateforme démocratique internationale — sa fonctionnalité phare. Tu as DEUX MODES, selon ce que le citoyen t'envoie.\n\n" +
        "MODE VÉRIFICATION (verdict COHERENT / CONTREDIT / NON_VERIFIABLE) — quand l'entrée est une AFFIRMATION factuelle à vérifier (un chiffre, un fait précis, une déclaration entendue) : " +
        'ton verdict se fonde EXCLUSIVEMENT sur trois matériaux : les données mesurées [D…], les références validées [R…], et le compte-rendu de recherche web mené sur les SOURCES AUTORISÉES. ' +
        "Tu ne cites jamais un chiffre, un fait ou une source absents de ces matériaux, et si rien ne permet de trancher, le verdict est NON_VERIFIABLE — le dire honnêtement est une réussite. " +
        "En complément du verdict, tu peux fournir un « éclairage » : 2 à 3 phrases de contexte général issues de tes connaissances, prudentes, affichées comme NON vérifiées — jamais un chiffre précis dont tu doutes, vide si rien de solide.\n\n" +
        "MODE RÉPONSE (verdict REPONSE) — quand l'entrée est une QUESTION ou une demande d'explication sur la démocratie, la citoyenneté, les institutions, les droits, les élections, la désinformation et l'esprit critique, ou la vie publique : " +
        "réponds-lui VRAIMENT, en éducateur civique remarquable : une réponse fluide, structurée et vivante de 4 à 8 phrases dans `explication`, claire pour tout niveau, concrète (exemples parlants), rigoureusement neutre politiquement — jamais d'opinion partisane, jamais de consigne de vote. " +
        "Cette réponse s'appuie sur tes connaissances générales (elle sera affichée comme telle) et s'enrichit des données [D…], références [R…] ou sources web quand elles l'illustrent — en citant alors leurs index. En mode REPONSE, laisse `eclairage` vide : la réponse EST l'éclairage.\n\n" +
        'Dans sourcesWeb, ne recopie QUE des URLs présentes dans le compte-rendu de recherche — jamais une URL de mémoire. ' +
        "HORS CHAMP : si l'entrée est étrangère à la vie démocratique et sociale (sport, célébrités, divertissement…), verdict NON_VERIFIABLE avec une explication déclinant poliment — index, indexReferences et sourcesWeb vides, eclairage vide. " +
        'Tu restes neutre et pédagogue, en français simple.',
      messages: [
        {
          role: 'user',
          content:
            `Message du citoyen :\n« ${donnees.affirmation} »\n\n` +
            `Données mesurées [D…] :\n${lignesDonnees || '(aucune)'}\n\n` +
            `Références validées par l'équipe [R…] :\n${lignesReferences || '(aucune)'}\n\n` +
            `--- RECHERCHE WEB SUR LES SOURCES AUTORISÉES ---\n${rechercheWeb || '(aucune recherche disponible)'}\n\n` +
            `Choisis le bon mode. AFFIRMATION factuelle → juge-la : COHERENT si les éléments la soutiennent, CONTREDIT s'ils la contredisent, NON_VERIFIABLE sinon, ` +
            `avec une explication de 2 à 5 phrases fondée en priorité sur les éléments les plus récents et les plus précis. ` +
            `QUESTION civique générale → verdict REPONSE, avec dans explication une réponse pédagogique complète et superbe. ` +
            `Dans tous les cas : liste les index des données (index) et des références (indexReferences) utilisées, les sources web réellement utilisées (sourcesWeb, titre + url tirés du compte-rendu), ` +
            `et l'éclairage général (eclairage — mode vérification seulement, chaîne vide sinon).`,
        },
      ],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              verdict: {
                type: 'string',
                enum: ['COHERENT', 'CONTREDIT', 'NON_VERIFIABLE', 'REPONSE'],
              },
              explication: { type: 'string' },
              index: {
                type: 'array',
                items: { type: 'integer' },
                description: 'Index des données mesurées utilisées (D)',
              },
              indexReferences: {
                type: 'array',
                items: { type: 'integer' },
                description: 'Index des références validées utilisées (R)',
              },
              sourcesWeb: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    titre: { type: 'string' },
                    url: { type: 'string' },
                  },
                  required: ['titre', 'url'],
                  additionalProperties: false,
                },
                description:
                  'Sources web utilisées — uniquement des URLs présentes dans le compte-rendu de recherche',
              },
              eclairage: {
                type: 'string',
                description:
                  'Contexte général (connaissances du modèle), prudent — chaîne vide si rien de solide',
              },
            },
            required: ['verdict', 'explication', 'index', 'indexReferences', 'sourcesWeb', 'eclairage'],
            additionalProperties: false,
          },
        },
      },
    });

    if (reponse.stop_reason === 'refusal') {
      return {
        verdict: 'NON_VERIFIABLE',
        explication:
          "Cette demande n'a pas pu être traitée par l'assistant. Reformulez votre affirmation.",
        elements: [],
        references: [],
        sourcesWeb: [],
        eclairage: null,
      };
    }

    const texte = reponse.content.find((b) => b.type === 'text')?.text;
    if (!texte) {
      throw new Error('Réponse IA vide');
    }

    const brut = JSON.parse(texte) as {
      verdict: ResultatVerification['verdict'];
      explication: string;
      index: number[];
      indexReferences: number[];
      sourcesWeb: { titre: string; url: string }[];
      eclairage: string;
    };
    return {
      verdict: brut.verdict,
      explication: brut.explication,
      // Seuls des index valides passent : les citations sortent de NOS listes.
      elements: (brut.index ?? [])
        .filter((i) => Number.isInteger(i) && i >= 0 && i < donnees.donnees.length)
        .map((i) => donnees.donnees[i]),
      references: (brut.indexReferences ?? [])
        .filter(
          (i) => Number.isInteger(i) && i >= 0 && i < donnees.references.length,
        )
        .map((i) => donnees.references[i]),
      // Garde-fou : seules les URLs réellement présentes dans le compte-rendu
      // de recherche passent — jamais une URL de mémoire, et uniquement des
      // domaines de la liste blanche.
      sourcesWeb: (brut.sourcesWeb ?? []).filter(
        (s) =>
          s?.url &&
          rechercheWeb.includes(s.url) &&
          donnees.domainesAutorises.some((d) => s.url.includes(d)),
      ),
      eclairage: brut.eclairage?.trim() || null,
    };
  }

  /**
   * Lit un fichier citoyen (image ou PDF) et en extrait les affirmations
   * factuelles vérifiables — une étape de LECTURE fidèle, sans verdict : le
   * texte extrait repart dans le circuit standard de vérification. Répond
   * « AUCUNE_AFFIRMATION » si le fichier n'affirme rien de vérifiable.
   */
  async extraireAffirmationsFichier(
    fichier: FichierAAnalyser,
    question?: string,
  ): Promise<string> {
    const blocFichier =
      fichier.mediaType === 'application/pdf'
        ? {
            type: 'document' as const,
            source: {
              type: 'base64' as const,
              media_type: 'application/pdf' as const,
              data: fichier.data,
            },
          }
        : {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: fichier.mediaType as
                | 'image/jpeg'
                | 'image/png'
                | 'image/webp'
                | 'image/gif',
              data: fichier.data,
            },
          };

    const consigne =
      `Un citoyen partage ce fichier pour vérification des faits.` +
      (question?.trim() ? ` Sa question : « ${question.trim().slice(0, 300)} »` : '') +
      `\n\nExtrais-en les 1 à 3 PRINCIPALES affirmations factuelles vérifiables ` +
      `(chiffres, dates, faits précis), en français, chacune reformulée en une ` +
      `phrase courte et autonome (compréhensible sans le fichier). ` +
      `Reste STRICTEMENT fidèle au contenu — n'ajoute, ne corrige et ne ` +
      `complète rien. Réponds UNIQUEMENT avec ces phrases, une par ligne. ` +
      `Si le fichier ne contient aucune affirmation factuelle vérifiable, ` +
      `réponds exactement : AUCUNE_AFFIRMATION`;

    const reponse = await this.client.messages.create({
      model: this.model,
      max_tokens: 600,
      system:
        'Tu lis des documents et images partagés par des citoyens sur une plateforme civique. Tu extrais fidèlement ce qui y est affirmé, sans jamais rien inventer ni interpréter.',
      messages: [
        {
          role: 'user',
          content: [blocFichier, { type: 'text', text: consigne }],
        },
      ],
    });

    if (reponse.stop_reason === 'refusal') {
      throw new Error(
        'Le service IA a décliné la lecture de ce fichier (classifieurs de sécurité)',
      );
    }

    return reponse.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
  }

  /** Appel texte simple à l'API Claude (thinking adaptatif par défaut) */
  private async completer(system: string, question: string): Promise<string> {
    const reponse = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: question }],
    });

    if (reponse.stop_reason === 'refusal') {
      throw new Error(
        'Le service IA a décliné cette demande (classifieurs de sécurité)',
      );
    }

    const contenu = reponse.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    if (!contenu) {
      throw new Error('Réponse IA vide');
    }
    return contenu;
  }
}
