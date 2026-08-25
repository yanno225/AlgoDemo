"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_BASE_URL, ApiError, apiPublic } from "@/lib/api/client";
import { BACK_OFFICE_ROLES, hasRole } from "@/lib/domain/roles";
import type { EtatConnexion } from "./etat-connexion";
import {
  SESSION_COOKIE,
  mapProfil,
  readSession,
  type ProfilBackend,
  type Session,
} from "./session";

/**
 * Actions du parcours d'accès, branchées sur l'API NestJS.
 *
 * Le cookie est `httpOnly` : il reste inaccessible au JavaScript de la page,
 * ce qui neutralise le vol de session par injection de script. `sameSite:
 * lax` bloque son envoi depuis un site tiers. Les jetons de l'API y sont
 * stockés — ils ne transitent jamais par le navigateur en clair.
 *
 * Le mot de passe n'est JAMAIS conservé côté serveur, même entre les deux
 * temps d'une connexion à double facteur : c'est le formulaire client qui le
 * garde en mémoire le temps de saisir le code TOTP.
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 8, // 8 heures — durée d'une journée de travail.
};

async function writeSession(session: Session) {
  (await cookies()).set(SESSION_COOKIE, JSON.stringify(session), COOKIE_OPTIONS);
}

interface Jetons {
  accessToken?: string;
  refreshToken?: string;
  /** Le backend répond ainsi quand la 2FA TOTP est activée sur le compte. */
  deuxFaRequis?: boolean;
}

/**
 * Profil associé à un access token tout juste délivré. On ne peut pas passer
 * par `apiFetch` ici : le cookie de session n'est pas encore écrit.
 * (Fonction interne — dans un fichier "use server", seuls les exports sont
 * exposés comme Server Actions.)
 */
async function recupererProfil(
  accessToken: string,
): Promise<ProfilBackend | null> {
  try {
    const reponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    return reponse.ok ? ((await reponse.json()) as ProfilBackend) : null;
  } catch {
    return null;
  }
}

/**
 * Connexion en un seul point d'entrée : mot de passe, puis code TOTP si le
 * compte en exige un. Le second appel renvoie les trois champs d'un coup —
 * c'est ce qu'attend `POST /auth/login`.
 */
export async function signIn(
  _etatPrecedent: EtatConnexion,
  formData: FormData,
): Promise<EtatConnexion> {
  const email = String(formData.get("identifiant") ?? "").trim().toLowerCase();
  const motDePasse = String(formData.get("motdepasse") ?? "");
  const codeOtp = String(formData.get("code") ?? "").replace(/\D/g, "");

  if (!email || !motDePasse) {
    return { statut: "erreur", message: "Renseignez votre email et votre mot de passe." };
  }

  let jetons: Jetons;
  try {
    jetons = await apiPublic<Jetons>("/auth/login", {
      email,
      motDePasse,
      // Le DTO impose exactement 6 chiffres : on n'envoie le champ que
      // lorsqu'il est complet, sinon la requête serait rejetée en 400.
      ...(codeOtp.length === 6 ? { codeOtp } : {}),
    });
  } catch (erreur) {
    if (erreur instanceof ApiError && erreur.statusCode === 401) {
      return {
        statut: codeOtp ? "code_requis" : "erreur",
        message: codeOtp
          ? "Code incorrect ou expiré. Un code TOTP change toutes les 30 secondes."
          : "Identifiants incorrects. Vérifiez votre saisie.",
      };
    }
    return {
      statut: "erreur",
      message:
        "Le service d'authentification est injoignable. Vérifiez que l'API est démarrée, puis réessayez.",
    };
  }

  // Double facteur activé : on redemande, en gardant le formulaire en place.
  if (jetons.deuxFaRequis || !jetons.accessToken) {
    return {
      statut: "code_requis",
      message: codeOtp
        ? "Code incorrect ou expiré. Réessayez avec le code affiché maintenant."
        : undefined,
    };
  }

  // Le back-office est interdit aux citoyens : on refuse avant d'ouvrir la
  // session, plutôt que de laisser la garde de section le faire plus tard.
  const profil = await recupererProfil(jetons.accessToken);
  if (!profil || !hasRole(mapProfil(profil).role, BACK_OFFICE_ROLES)) {
    return {
      statut: "erreur",
      message:
        "Votre compte n'a pas accès à l'administration. Les citoyens utilisent l'application mobile AlgoDémo.",
    };
  }

  await writeSession({
    email,
    stage: "verified",
    accessToken: jetons.accessToken,
    refreshToken: jetons.refreshToken,
    // Trace de la robustesse réelle de la session, affichée à l'étape suivante.
    deuxFa: Boolean(profil.deuxFaActif),
  });
  redirect("/connexion/protocole");
}

/** Étape finale — acceptation du protocole de responsabilité (RG-USR-07). */
export async function acceptProtocol(formData: FormData) {
  const session = await readSession();
  if (!session?.accessToken) redirect("/connexion");

  if (!formData.get("acceptation")) {
    redirect("/connexion/protocole?erreur=acceptation");
  }

  // TODO(backend) : POST /auth/accept-protocol — l'acceptation doit être
  // horodatée et conservée côté serveur, c'est une exigence de traçabilité.
  await writeSession({ ...session, stage: "active" });
  redirect("/");
}

/** Déconnexion — le refresh token est révoqué côté API, puis le cookie détruit. */
export async function signOut() {
  const session = await readSession();
  if (session?.accessToken) {
    try {
      const { apiFetch } = await import("@/lib/api/client");
      await apiFetch("/auth/logout", { methode: "POST" });
    } catch {
      // Jeton déjà expiré côté API : la déconnexion locale suffit.
    }
  }
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/connexion");
}
