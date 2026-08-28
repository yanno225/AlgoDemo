import { apiClient } from './client';

/**
 * Assistant IA de vérification des faits — fonctionnalité phare.
 *
 * Le backend confronte l'affirmation aux SEULES valeurs d'indicateurs
 * validées de la plateforme (sources tracées) : chaque élément cité ci-dessous
 * provient de ces données, jamais d'une invention du modèle.
 */

/**
 * COHERENT/CONTREDIT/NON_VERIFIABLE jugent une affirmation factuelle ;
 * REPONSE est le mode pédagogique — le citoyen a posé une question civique
 * et `explication` porte une vraie réponse d'éducation civique.
 */
export type FactVerdict = 'COHERENT' | 'CONTREDIT' | 'NON_VERIFIABLE' | 'REPONSE';

export interface FactElement {
  thematique: string;
  critere: string;
  indicateur: string;
  paysOuZone: string;
  valeur: number;
  annee: string;
  source: string;
}

/** Texte validé par l'équipe (synthèse publiée, contenu vérifié du feed). */
export interface FactReference {
  titre: string;
  texte: string;
  source: string;
}

/** Source web de la liste blanche consultée pendant la vérification. */
export interface FactWebSource {
  titre: string;
  url: string;
}

export interface FactCheck {
  verdict: FactVerdict;
  explication: string;
  elements: FactElement[];
  references: FactReference[];
  /** Recherche web EN DIRECT, restreinte à la liste blanche des sources. */
  sourcesWeb: FactWebSource[];
  /**
   * Contexte général issu des connaissances du modèle — jamais compté dans
   * le verdict, affiché « non vérifié par nos sources ».
   */
  eclairage: string | null;
}

/** Résultat d'une analyse de FICHIER : le verdict + ce qui a été extrait. */
export interface FileFactCheck extends FactCheck {
  /**
   * Les affirmations que l'IA a lues dans le fichier — c'est CE texte qui a
   * été soumis au verdict. Null si le fichier n'affirmait rien de vérifiable.
   */
  affirmationAnalysee: string | null;
}

/** Fichier choisi par le citoyen (image ou PDF) à faire analyser. */
export interface FileToVerify {
  uri: string;
  name: string;
  mimeType: string;
}

/**
 * Analyse d'un fichier : l'IA en extrait les affirmations factuelles puis
 * les confronte aux données de la plateforme et à la liste blanche — même
 * circuit anti-hallucination que la vérification texte.
 */
export async function verifyFactFromFile(
  file: FileToVerify,
  question?: string
): Promise<FileFactCheck> {
  const form = new FormData();
  // React Native attend un objet { uri, name, type } pour un fichier.
  form.append('fichier', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);
  if (question?.trim()) form.append('question', question.trim());

  const { data } = await apiClient.post<FileFactCheck>(
    '/assistant/verifier-fichier',
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Lecture du fichier + recherche liste blanche + verdict : patience.
      timeout: 240_000,
    }
  );
  return data;
}

export async function verifyFact(affirmation: string): Promise<FactCheck> {
  const { data } = await apiClient.post<FactCheck>(
    '/assistant/verifier',
    { affirmation },
    {
      // La vérification enchaîne recherche web sur liste blanche puis
      // verdict structuré : couramment 30 à 90 s. Avec le délai global de
      // 15 s, le téléphone raccrochait (« impossible de joindre le
      // serveur ») pendant que le serveur, lui, répondait 201 dans le vide.
      timeout: 180_000,
    }
  );
  return data;
}
