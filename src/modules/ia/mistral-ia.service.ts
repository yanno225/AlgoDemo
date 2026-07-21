import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DonneesResumeDebat,
  DonneesSynthese,
  IaService,
  IndicateurConnu,
  PropositionValeur,
} from './ia-service.interface';

/** Message du format de chat (compatible API Mistral) */
interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

/**
 * Implémentation réelle du service IA via Mistral AI (entreprise française,
 * serveurs européens — cohérent RGPD, CDC §9.3). Palier gratuit de
 * La Plateforme. Configuration (.env) : MISTRAL_API_KEY · MISTRAL_MODEL.
 *
 * Choisie automatiquement (à la place du stub) dès qu'une clé est présente,
 * via la factory de ia.module.ts.
 */
@Injectable()
export class MistralIaService implements IaService {
  private readonly logger = new Logger(MistralIaService.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly endpoint = 'https://api.mistral.ai/v1/chat/completions';

  constructor(configService: ConfigService) {
    this.apiKey = configService.get<string>('MISTRAL_API_KEY', '');
    this.model = configService.get<string>('MISTRAL_MODEL', 'mistral-small-latest');
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

    return this.completer([
      {
        role: 'system',
        content:
          "Tu es un analyste de la démocratie qui rédige des synthèses claires, neutres et vérifiables, en français, pour des citoyens de tous niveaux. N'invente aucun chiffre : appuie-toi uniquement sur les données fournies.",
      },
      {
        role: 'user',
        content:
          `Rédige une synthèse (5 à 8 phrases) de la thématique « ${donnees.thematique} » ` +
          `pour ${donnees.paysOuZone}, à partir de ces indicateurs mesurés :\n${lignes || '(aucune donnée disponible)'}\n\n` +
          `Décris les tendances et l'évolution dans le temps, sans jargon.`,
      },
    ]);
  }

  async genererResumeDebat(donnees: DonneesResumeDebat): Promise<string> {
    const affirmations = donnees.affirmations
      .map((a) => {
        const total = a.valides + a.invalides;
        return `- « ${a.texte} » : ${a.valides} votes « vrai », ${a.invalides} votes « faux » (${total} votants)`;
      })
      .join('\n');

    return this.completer([
      {
        role: 'system',
        content:
          "Tu es un modérateur de débat citoyen. Tu rédiges des résumés fidèles, neutres et pédagogiques en français, destinés à être publiés pour le grand public. Ne prends pas parti ; rapporte les faits et les résultats des votes.",
      },
      {
        role: 'user',
        content:
          `Rédige le résumé (6 à 10 phrases) d'un débat citoyen terminé.\n` +
          `Titre : ${donnees.titre}\nThématique : ${donnees.thematique}\n` +
          (donnees.description ? `Contexte : ${donnees.description}\n` : '') +
          `Affirmations soumises au vote de la salle :\n${affirmations || '(aucune)'}\n\n` +
          `Restitue les points débattus et, pour chaque affirmation, comment la salle l'a jugée.`,
      },
    ]);
  }

  async extraireValeurs(
    texteBrut: string,
    indicateursConnus: IndicateurConnu[],
  ): Promise<PropositionValeur[]> {
    const liste = indicateursConnus
      .map((i) => `${i.id} = ${i.libelle}`)
      .join('\n');

    const reponse = await this.completer(
      [
        {
          role: 'system',
          content:
            "Tu extrais des valeurs chiffrées d'un texte et tu les rattaches à une liste FERMÉE d'indicateurs connus. Tu ne crées jamais d'indicateur. Tu réponds UNIQUEMENT par un tableau JSON valide, sans texte autour.",
        },
        {
          role: 'user',
          content:
            `Indicateurs connus (id = libellé) :\n${liste}\n\n` +
            `Texte à analyser :\n"""${texteBrut.slice(0, 6000)}"""\n\n` +
            `Renvoie un tableau JSON d'objets {"indicateurId","valeur","dateMesure":"AAAA-MM-JJ","source"} ` +
            `uniquement pour les indicateurs de la liste dont une valeur chiffrée apparaît clairement. ` +
            `Tableau vide [] si rien de fiable.`,
        },
      ],
      true,
    );

    try {
      const json = this.extraireJson(reponse);
      const brut: unknown = JSON.parse(json);
      if (!Array.isArray(brut)) return [];
      const idsConnus = new Set(indicateursConnus.map((i) => i.id));
      return brut
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
          source: p.source ?? 'Extraction IA (à vérifier)',
        }));
    } catch (e) {
      this.logger.error(
        'Réponse IA non parsable pour extraireValeurs',
        e instanceof Error ? e.message : String(e),
      );
      return [];
    }
  }

  /** Appel à l'API de complétion Mistral */
  private async completer(
    messages: ChatMessage[],
    jsonMode = false,
  ): Promise<string> {
    const reponse = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.3,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text();
      this.logger.error(`Erreur Mistral ${reponse.status} : ${detail}`);
      throw new Error(`Le service IA a répondu ${reponse.status}`);
    }

    const data = (await reponse.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const contenu = data.choices?.[0]?.message?.content?.trim();
    if (!contenu) {
      throw new Error('Réponse IA vide');
    }
    return contenu;
  }

  /** Isole le tableau/objet JSON même si le modèle l'entoure de texte */
  private extraireJson(texte: string): string {
    const debut = texte.indexOf('[');
    const fin = texte.lastIndexOf(']');
    if (debut !== -1 && fin > debut) {
      return texte.slice(debut, fin + 1);
    }
    return texte;
  }
}
