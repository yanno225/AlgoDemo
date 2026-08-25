import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, type Session } from "@/lib/auth/session";

/**
 * Client HTTP du back-office vers l'API NestJS.
 *
 * Tout passe par le serveur Next : les jetons vivent dans un cookie
 * `httpOnly` et ne sont jamais exposés au JavaScript de la page. Le
 * rafraîchissement d'un access token expiré (15 min) est transparent.
 *
 * `server-only` fait échouer la compilation si ce module est importé depuis un
 * composant client — garde-fou contre une fuite de jeton.
 */

export const API_BASE_URL =
  process.env.API_BASE_URL ?? "http://localhost:3000";

/** Erreur applicative renvoyée par l'API (format uniforme du backend). */
export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ReponseErreur {
  message?: string | string[];
  statusCode?: number;
}

/** Décode le corps d'erreur du backend en un message lisible. */
async function messageDErreur(reponse: Response): Promise<string> {
  try {
    const corps = (await reponse.json()) as ReponseErreur;
    if (Array.isArray(corps.message)) return corps.message.join(", ");
    if (corps.message) return corps.message;
  } catch {
    // Corps vide ou non-JSON : on retombe sur le statut HTTP.
  }
  return `L'API a répondu ${reponse.status}`;
}

/** Appel direct, sans jeton (login, refresh). */
export async function apiPublic<T>(
  chemin: string,
  corps: unknown,
): Promise<T> {
  const reponse = await fetch(`${API_BASE_URL}${chemin}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
    cache: "no-store",
  });
  if (!reponse.ok) {
    throw new ApiError(reponse.status, await messageDErreur(reponse));
  }
  return reponse.json() as Promise<T>;
}

async function lireSession(): Promise<Session | null> {
  const brut = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!brut) return null;
  try {
    return JSON.parse(brut) as Session;
  } catch {
    return null;
  }
}

/**
 * Rejoue la demande de jetons avec le refresh token. Renvoie le nouvel access
 * token, ou null si le refresh est lui aussi expiré (session à refaire).
 *
 * Le cookie n'est réécrit que si l'appelant le peut : Next interdit
 * `cookies().set()` pendant le rendu d'une page. En lecture seule on renvoie
 * quand même le jeton frais — la requête en cours aboutit, et le cookie sera
 * mis à jour à la prochaine Server Action.
 */
async function rafraichir(session: Session): Promise<string | null> {
  if (!session.refreshToken) return null;
  try {
    const jetons = await apiPublic<{
      accessToken: string;
      refreshToken: string;
    }>("/auth/refresh", { refreshToken: session.refreshToken });

    try {
      (await cookies()).set(
        SESSION_COOKIE,
        JSON.stringify({ ...session, ...jetons } satisfies Session),
        {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 8,
        },
      );
    } catch {
      // Contexte de rendu : écriture de cookie interdite, sans gravité.
    }
    return jetons.accessToken;
  } catch {
    return null;
  }
}

interface OptionsRequete {
  methode?: "GET" | "POST" | "PATCH" | "DELETE";
  corps?: unknown;
  /** Paramètres de requête ; les valeurs vides sont ignorées. */
  parametres?: Record<string, string | undefined>;
}

/**
 * Appel authentifié à l'API. Un 401 déclenche UN rafraîchissement puis un
 * seul réessai — jamais de boucle.
 */
export async function apiFetch<T>(
  chemin: string,
  options: OptionsRequete = {},
): Promise<T> {
  const session = await lireSession();
  if (!session?.accessToken) {
    // Pas de session : rediriger vaut mieux que lancer une erreur — sans ça,
    // les pages qui chargent leurs données en parallèle de la garde d'accès
    // salissent le terminal d'un faux « Session expirée » à chaque démarrage.
    redirect("/connexion");
  }

  const url = new URL(`${API_BASE_URL}${chemin}`);
  for (const [cle, valeur] of Object.entries(options.parametres ?? {})) {
    if (valeur) url.searchParams.set(cle, valeur);
  }

  const envoyer = (jeton: string) =>
    fetch(url, {
      method: options.methode ?? "GET",
      headers: {
        Authorization: `Bearer ${jeton}`,
        ...(options.corps ? { "Content-Type": "application/json" } : {}),
      },
      ...(options.corps ? { body: JSON.stringify(options.corps) } : {}),
      cache: "no-store",
    });

  let reponse = await envoyer(session.accessToken);

  if (reponse.status === 401) {
    const jetonFrais = await rafraichir(session);
    if (!jetonFrais) {
      // Jetons irrécupérables : retour à l'écran de connexion, sans bruit.
      redirect("/connexion");
    }
    reponse = await envoyer(jetonFrais);
  }

  if (!reponse.ok) {
    throw new ApiError(reponse.status, await messageDErreur(reponse));
  }
  // 204 No Content : rien à décoder.
  return reponse.status === 204
    ? (undefined as T)
    : (reponse.json() as Promise<T>);
}

/**
 * Envoi d'un fichier à l'API (multipart) — utilisé pour les couvertures de
 * débats via POST /media/upload. Même discipline que `apiFetch` : jeton du
 * cookie httpOnly, un seul rafraîchissement puis un seul réessai.
 */
export async function apiUpload<T>(
  chemin: string,
  fichier: File,
  nomChamp = "fichier",
): Promise<T> {
  const session = await lireSession();
  if (!session?.accessToken) {
    redirect("/connexion");
  }

  const envoyer = (jeton: string) => {
    const corps = new FormData();
    corps.append(nomChamp, fichier, fichier.name);
    return fetch(`${API_BASE_URL}${chemin}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jeton}` },
      body: corps,
      cache: "no-store",
    });
  };

  let reponse = await envoyer(session.accessToken);
  if (reponse.status === 401) {
    const jetonFrais = await rafraichir(session);
    if (!jetonFrais) {
      throw new ApiError(401, "Session expirée — reconnectez-vous.");
    }
    reponse = await envoyer(jetonFrais);
  }
  if (!reponse.ok) {
    throw new ApiError(reponse.status, await messageDErreur(reponse));
  }
  return reponse.json() as Promise<T>;
}
