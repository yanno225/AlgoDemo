import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  DonneesReformulation,
  DonneesResumeDebat,
  DonneesSynthese,
  DonneesVerification,
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
      `Rédige une synthèse (5 à 8 phrases) de la thématique « ${donnees.thematique} » ` +
        `pour ${donnees.paysOuZone}, à partir de ces indicateurs mesurés :\n${lignes || '(aucune donnée disponible)'}\n\n` +
        `Décris les tendances et l'évolution dans le temps, sans jargon. ` +
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

  async verifierAffirmation(
    donnees: DonneesVerification,
  ): Promise<ResultatVerification> {
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
        "Tu es l'assistant de vérification des faits d'une plateforme démocratique citoyenne internationale. " +
        'Ton VERDICT se fonde exclusivement sur les données mesurées [D…] et les références validées [R…] fournies : ' +
        "tu ne cites jamais un chiffre, un fait ou une source absents de ces listes, et si elles ne permettent pas de trancher, le verdict est NON_VERIFIABLE — le dire honnêtement est une réussite. " +
        "En COMPLÉMENT du verdict, tu peux fournir un « éclairage » : 2 à 3 phrases de contexte général issues de tes connaissances, prudentes et factuelles, qui aident le citoyen à comprendre le sujet. " +
        "Cet éclairage sera affiché comme NON vérifié par la plateforme : n'y avance jamais un chiffre précis dont tu n'es pas sûr, et laisse-le vide si tu n'as rien de solide. " +
        'Tu restes neutre et pédagogue, en français simple.',
      messages: [
        {
          role: 'user',
          content:
            `Affirmation du citoyen :\n« ${donnees.affirmation} »\n\n` +
            `Données mesurées [D…] :\n${lignesDonnees || '(aucune)'}\n\n` +
            `Références validées par l'équipe [R…] :\n${lignesReferences || '(aucune)'}\n\n` +
            `Juge l'affirmation : COHERENT si les éléments la soutiennent, CONTREDIT s'ils la contredisent, ` +
            `NON_VERIFIABLE sinon. Explique en 2 à 4 phrases simples, liste les index des données (index) et des références (indexReferences) utilisées, ` +
            `et ajoute ton éclairage général (eclairage, chaîne vide si rien d'utile).`,
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
                enum: ['COHERENT', 'CONTREDIT', 'NON_VERIFIABLE'],
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
              eclairage: {
                type: 'string',
                description:
                  'Contexte général (connaissances du modèle), prudent — chaîne vide si rien de solide',
              },
            },
            required: ['verdict', 'explication', 'index', 'indexReferences', 'eclairage'],
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
      eclairage: brut.eclairage?.trim() || null,
    };
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
