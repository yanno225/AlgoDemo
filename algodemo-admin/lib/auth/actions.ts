"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  DEMO_ACCOUNTS,
  SESSION_COOKIE,
  readSession,
  type Session,
} from "./session";

/**
 * Actions du parcours d'accès.
 *
 * Le cookie est `httpOnly` : il reste inaccessible au JavaScript de la page,
 * ce qui neutralise le vol de session par injection de script. `sameSite:
 * lax` bloque son envoi depuis un site tiers.
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

/** Étape 1 — vérification des identifiants. */
export async function signIn(formData: FormData) {
  const email = String(formData.get("identifiant") ?? "").trim().toLowerCase();
  const password = String(formData.get("motdepasse") ?? "");

  // TODO(backend) : POST /auth/login. La vérification du mot de passe doit
  // se faire côté serveur applicatif, jamais ici.
  const account = DEMO_ACCOUNTS[email];

  if (!account || password.length < 4) {
    redirect("/connexion?erreur=identifiants");
  }

  await writeSession({ email, stage: "credentials" });
  redirect("/connexion/verification");
}

/** Étape 2 — code de vérification à usage unique. */
export async function verifyCode(formData: FormData) {
  const session = await readSession();
  if (!session) redirect("/connexion");

  const code = String(formData.get("code") ?? "").replace(/\D/g, "");

  // TODO(backend) : POST /auth/verify-2fa. Tout code à 6 chiffres est
  // actuellement accepté, faute de service d'envoi.
  if (code.length !== 6) {
    redirect("/connexion/verification?erreur=code");
  }

  await writeSession({ ...session, stage: "verified" });
  redirect("/connexion/protocole");
}

/** Étape 3 — acceptation du protocole de responsabilité (RG-USR-07). */
export async function acceptProtocol(formData: FormData) {
  const session = await readSession();
  if (!session) redirect("/connexion");

  if (!formData.get("acceptation")) {
    redirect("/connexion/protocole?erreur=acceptation");
  }

  // TODO(backend) : POST /auth/accept-protocol — l'acceptation doit être
  // horodatée et conservée, c'est une exigence de traçabilité.
  await writeSession({ ...session, stage: "active" });
  redirect("/");
}

/** Déconnexion — le cookie est détruit côté serveur. */
export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/connexion");
}
