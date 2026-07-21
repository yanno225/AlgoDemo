import { ROLES } from "@/lib/domain/roles";
import type { AccountDetail, AdminUser } from "@/lib/domain/types";

/**
 * Comptes citoyens et administrateurs.
 *
 * TODO(backend) : remplacer par GET /admin/accounts (paginé, filtrable par
 * rôle) et GET /admin/accounts/:id. La signature des fonctions ci-dessous ne
 * changera pas.
 */

const ACCOUNTS: AccountDetail[] = [
  {
    id: "acc_1",
    firstName: "Elena",
    lastName: "Marceau",
    email: "elena.m@labo.org",
    phone: "+225 07 11 22 33",
    role: ROLES.STANDARD,
    isActive: true,
    createdAt: "2023-03-14T10:00:00.000Z",
    activity: { contributions: 38, votes: 21, debates: 4 },
    roleHistory: [
      { id: "ev_1", type: "created", label: "Création du compte", at: "2023-03-14T10:00:00.000Z" },
    ],
  },
  {
    id: "acc_2",
    firstName: "Jean-Luc",
    lastName: "Morel",
    email: "j.morel@citoyen.fr",
    phone: "+225 05 44 55 66",
    role: ROLES.POINT_FOCAL,
    isActive: true,
    createdAt: "2022-05-12T08:30:00.000Z",
    activity: { contributions: 142, votes: 85, debates: 12 },
    roleHistory: [
      {
        id: "ev_2",
        type: "certified",
        label: "Certification accordée",
        at: "2023-07-14T14:20:00.000Z",
        by: "Marie Vallet",
      },
      { id: "ev_3", type: "created", label: "Création du compte", at: "2022-05-12T08:30:00.000Z" },
    ],
  },
  {
    id: "acc_3",
    firstName: "Sophie",
    lastName: "Vallet",
    email: "s.vallet@algo.gov",
    role: ROLES.ADMIN_LABO,
    isActive: true,
    createdAt: "2021-11-02T09:15:00.000Z",
    activity: { contributions: 12, votes: 6, debates: 31 },
    roleHistory: [
      { id: "ev_4", type: "created", label: "Création du compte", at: "2021-11-02T09:15:00.000Z" },
    ],
  },
  {
    id: "acc_4",
    firstName: "Compte",
    lastName: "#892",
    email: "Données chiffrées",
    role: ROLES.STANDARD,
    isActive: true,
    isAnonymised: true,
    createdAt: "2024-01-20T16:45:00.000Z",
    activity: { contributions: 9, votes: 14, debates: 0 },
    roleHistory: [
      { id: "ev_5", type: "created", label: "Création du compte", at: "2024-01-20T16:45:00.000Z" },
    ],
  },
  {
    id: "acc_5",
    firstName: "Amira",
    lastName: "K.",
    email: "amira.k@outlook.com",
    phone: "+225 01 78 90 12",
    role: ROLES.STANDARD,
    isActive: true,
    createdAt: "2024-06-08T11:05:00.000Z",
    activity: { contributions: 55, votes: 40, debates: 2 },
    roleHistory: [
      { id: "ev_6", type: "created", label: "Création du compte", at: "2024-06-08T11:05:00.000Z" },
    ],
  },
  {
    id: "acc_6",
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean.dupont@exemple.com",
    phone: "+225 07 34 56 78",
    role: ROLES.POINT_FOCAL,
    isActive: true,
    createdAt: "2022-05-12T09:00:00.000Z",
    activity: { contributions: 142, votes: 85, debates: 12 },
    roleHistory: [
      {
        id: "ev_7",
        type: "certified",
        label: "Certification accordée",
        at: "2023-07-14T09:00:00.000Z",
        by: "Marie Vallet",
      },
      { id: "ev_8", type: "created", label: "Création du compte", at: "2022-05-12T09:00:00.000Z" },
    ],
  },
];

/** Volumétrie réelle de la plateforme, indépendante de la page courante. */
export const TOTAL_ACCOUNTS = 1240;

export async function listAccounts(): Promise<AdminUser[]> {
  return ACCOUNTS;
}

export async function getAccount(id: string): Promise<AccountDetail | null> {
  return ACCOUNTS.find((account) => account.id === id) ?? null;
}
