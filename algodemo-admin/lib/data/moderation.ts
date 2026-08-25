import { apiFetch } from "@/lib/api/client";

/**
 * Modération — branchée sur l'API NestJS.
 *
 * Quatre files distinctes côté backend, réunies en un seul écran :
 *  - avis citoyens en attente        (GET /avis/moderation)
 *  - signalements de contenu         (GET /feed/signalements)
 *  - contenus à vérifier/publier     (GET /feed/moderation)
 *  - synthèses IA de la fiche pays   (GET /syntheses?statut=…)
 *  - résumés de débats générés par IA (GET /debats/resumes/liste?statut=…)
 *
 * Les propositions de collecte (données chiffrées) ne sont PAS ici : leur
 * validation exige le contexte de triangulation, qui vit dans l'écran
 * Collecte. La page de modération y renvoie.
 */

interface ThematiqueApi {
  id: string;
  libelle: string;
}

export interface AvisEnAttente {
  id: string;
  texte: string;
  auteurId: string;
  /** Nom de l'auteur si résoluble (liste des comptes réservée à l'ADMIN). */
  auteur: string | null;
  thematique: ThematiqueApi | null;
  creeLe: string;
}

export interface SignalementEnAttente {
  id: string;
  motif: string;
  signalePar: string;
  /** Nom du signaleur si résoluble (liste des comptes réservée à l'ADMIN). */
  signaleur: string | null;
  creeLe: string;
  contenu: { id: string; titre: string };
}

export type StatutVerification =
  | "NON_VERIFIE"
  | "PARTIELLEMENT_VERIFIE"
  | "VERIFIE";

export interface ContenuAModerer {
  id: string;
  titre: string;
  corps: string;
  type: string;
  statutVerification: StatutVerification;
  estPublie: boolean;
  estOfficiel: boolean;
  source: string | null;
  urlMedia: string | null;
  thematique: ThematiqueApi | null;
  creeLe: string;
}

/** Texte généré par l'IA, en attente de validation humaine. */
export interface TexteAValider {
  id: string;
  /** Ce que l'IA a produit — jamais publié tel quel. */
  texteGenereIA: string;
  dateGeneration: string;
  /** Synthèse : pays concerné. Résumé : titre du débat. */
  contexte: string;
  thematique: ThematiqueApi | null;
}

interface AvisApi {
  id: string;
  texte: string;
  auteurId: string;
  thematique: ThematiqueApi | null;
  creeLe: string;
}

async function nomsDesComptes(): Promise<Map<string, string>> {
  try {
    const comptes = await apiFetch<
      { id: string; prenom: string; nom: string }[]
    >("/auth/users");
    return new Map(
      comptes.map((c) => [c.id, `${c.prenom} ${c.nom}`.trim()]),
    );
  } catch {
    // Liste des comptes réservée à l'ADMIN : un point focal verra « Citoyen »
    // à la place des noms — dégradation assumée plutôt qu'un écran en erreur.
    return new Map();
  }
}

interface SignalementApi {
  id: string;
  motif: string;
  signalePar: string;
  creeLe: string;
  contenu: { id: string; titre: string };
}

interface SyntheseApi {
  id: string;
  paysOuZone: string;
  texteGenereIA: string;
  dateGeneration: string;
  thematique: ThematiqueApi | null;
}

export async function listSynthesesEnAttente(): Promise<TexteAValider[]> {
  const syntheses = await apiFetch<SyntheseApi[]>("/syntheses", {
    parametres: { statut: "EN_ATTENTE_VALIDATION" },
  });
  return syntheses.map((s) => ({
    id: s.id,
    texteGenereIA: s.texteGenereIA,
    dateGeneration: s.dateGeneration,
    contexte: s.paysOuZone,
    thematique: s.thematique,
  }));
}

interface ResumeApi {
  id: string;
  texteGenereIA: string;
  dateGeneration: string;
  debat: { id: string; titre: string; thematique?: ThematiqueApi | null } | null;
}

export async function listResumesEnAttente(): Promise<TexteAValider[]> {
  const resumes = await apiFetch<ResumeApi[]>("/debats/resumes/liste", {
    parametres: { statut: "EN_ATTENTE_VALIDATION" },
  });
  return resumes.map((r) => ({
    id: r.id,
    texteGenereIA: r.texteGenereIA,
    dateGeneration: r.dateGeneration,
    contexte: r.debat?.titre ?? "Débat",
    thematique: r.debat?.thematique ?? null,
  }));
}

/** Propositions de collecte en attente — comptées pour le renvoi vers la Collecte. */
async function compterPropositionsEnAttente(): Promise<number> {
  try {
    const propositions = await apiFetch<unknown[]>("/collecte/propositions", {
      parametres: { statut: "EN_ATTENTE" },
    });
    return propositions.length;
  } catch {
    // Réservé à l'ADMIN : un point focal voit simplement le renvoi disparaître.
    return 0;
  }
}

export interface FilesModeration {
  avis: AvisEnAttente[];
  signalements: SignalementEnAttente[];
  contenus: ContenuAModerer[];
  syntheses: TexteAValider[];
  resumes: TexteAValider[];
  /** Données chiffrées en attente — validées dans l'écran Collecte. */
  propositionsEnAttente: number;
}

/**
 * Toutes les files en un chargement : les cinq listes partent en parallèle et
 * la résolution des noms (un seul appel) sert aux avis comme aux signalements.
 */
export async function chargerFilesModeration(): Promise<FilesModeration> {
  const [noms, avis, signalements, contenus, syntheses, resumes, propositionsEnAttente] =
    await Promise.all([
      nomsDesComptes(),
      apiFetch<AvisApi[]>("/avis/moderation"),
      apiFetch<SignalementApi[]>("/feed/signalements"),
      apiFetch<ContenuAModerer[]>("/feed/moderation"),
      listSynthesesEnAttente(),
      listResumesEnAttente(),
      compterPropositionsEnAttente(),
    ]);

  return {
    avis: avis.map((a) => ({ ...a, auteur: noms.get(a.auteurId) ?? null })),
    signalements: signalements.map((s) => ({
      ...s,
      signaleur: noms.get(s.signalePar) ?? null,
    })),
    contenus,
    syntheses,
    resumes,
    propositionsEnAttente,
  };
}
