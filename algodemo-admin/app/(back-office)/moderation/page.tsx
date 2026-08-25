import Link from "next/link";
import { ArrowRight, Clapperboard, Database, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { chargerFilesModeration } from "@/lib/data/moderation";
import {
  rejeterResume,
  rejeterSynthese,
  validerResume,
  validerSynthese,
} from "@/lib/data/moderation-actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { AvisCard } from "@/components/moderation/AvisCard";
import { SignalementCard } from "@/components/moderation/SignalementCard";
import { ContenuCard } from "@/components/moderation/ContenuCard";
import { TexteIACard } from "@/components/moderation/TexteIACard";

export const metadata = { title: "Modération" };

const ONGLETS = [
  "avis",
  "signalements",
  "verification",
  "syntheses",
  "resumes",
] as const;
type Onglet = (typeof ONGLETS)[number];

const estOnglet = (valeur: string | undefined): valeur is Onglet =>
  ONGLETS.includes(valeur as Onglet);

/** File vide = travail à jour : le dire vaut mieux qu'un écran blanc. */
function FileVide({ message }: { message: string }) {
  return (
    <div className="animate-rise rounded-xl bg-surface px-6 py-14 text-center shadow-sm ring-1 ring-hairline">
      <PartyPopper className="mx-auto size-6 text-primary" aria-hidden />
      <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-ink-muted">
        {message}
      </p>
    </div>
  );
}

export default async function ModerationPage({
  searchParams,
}: {
  // Next 16 : `searchParams` est asynchrone.
  searchParams: Promise<{ onglet?: string }>;
}) {
  const { onglet } = await searchParams;
  const ongletActif: Onglet = estOnglet(onglet) ? onglet : "avis";

  const files = await chargerFilesModeration();

  return (
    <>
      <PageHeader
        title="Modération"
        description="Rien n'atteint les citoyens sans passer ici : avis, signalements, contenus à vérifier et textes générés par l'IA."
        actions={
          <Button
            href="/moderation/publier"
            icon={<Clapperboard className="size-4" />}
          >
            Publier un contenu
          </Button>
        }
      />

      {/* Les données chiffrées se valident dans la Collecte, avec leur
          contexte de triangulation — on y renvoie plutôt que de dupliquer. */}
      {files.propositionsEnAttente > 0 && (
        <Link
          href="/collecte"
          className="group mb-6 flex items-center gap-3 rounded-xl bg-secondary-pale p-4 ring-1 ring-secondary/25 transition-all duration-200 hover:-translate-y-px hover:shadow-md"
        >
          <Database className="size-[18px] shrink-0 text-secondary" aria-hidden />
          <p className="flex-1 text-[14px] leading-relaxed text-ink-muted">
            <strong className="text-ink">
              {files.propositionsEnAttente} donnée
              {files.propositionsEnAttente > 1 ? "s" : ""} chiffrée
              {files.propositionsEnAttente > 1 ? "s" : ""}
            </strong>{" "}
            attend{files.propositionsEnAttente > 1 ? "ent" : ""} validation dans
            la Collecte, avec la triangulation des sources.
          </p>
          <ArrowRight
            className="size-4 shrink-0 text-secondary transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}

      <Tabs
        activeKey={ongletActif}
        hrefForTab={(key) => `/moderation?onglet=${key}`}
        className="mb-6"
        tabs={[
          { key: "avis", label: "Avis", count: files.avis.length },
          {
            key: "signalements",
            label: "Signalements",
            count: files.signalements.length,
          },
          {
            key: "verification",
            label: "Vérification",
            count: files.contenus.length,
          },
          { key: "syntheses", label: "Synthèses IA", count: files.syntheses.length },
          { key: "resumes", label: "Résumés de débats", count: files.resumes.length },
        ]}
      />

      {ongletActif === "avis" &&
        (files.avis.length > 0 ? (
          <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {files.avis.map((avis, index) => (
              <AvisCard key={avis.id} avis={avis} index={index} />
            ))}
          </div>
        ) : (
          <FileVide message="Aucun avis en attente — chaque contribution citoyenne a reçu une décision." />
        ))}

      {ongletActif === "signalements" &&
        (files.signalements.length > 0 ? (
          <div className="grid items-start gap-4 xl:grid-cols-2">
            {files.signalements.map((signalement, index) => (
              <SignalementCard
                key={signalement.id}
                signalement={signalement}
                index={index}
              />
            ))}
          </div>
        ) : (
          <FileVide message="Aucun signalement en attente — rien de suspect n'a été remonté par les citoyens." />
        ))}

      {ongletActif === "verification" &&
        (files.contenus.length > 0 ? (
          <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {files.contenus.map((contenu, index) => (
              <ContenuCard key={contenu.id} contenu={contenu} index={index} />
            ))}
          </div>
        ) : (
          <FileVide message="Aucun contenu en cours de vérification — tout ce qui est publié a été triangulé." />
        ))}

      {ongletActif === "syntheses" &&
        (files.syntheses.length > 0 ? (
          <div className="grid items-start gap-5 xl:grid-cols-2">
            {files.syntheses.map((synthese, index) => (
              <TexteIACard
                key={synthese.id}
                texte={synthese}
                nature="Synthèse de fiche pays"
                actionValider={validerSynthese}
                actionRejeter={rejeterSynthese}
                index={index}
              />
            ))}
          </div>
        ) : (
          <FileVide message="Aucune synthèse IA en attente — la fiche pays est à jour de ses validations." />
        ))}

      {ongletActif === "resumes" &&
        (files.resumes.length > 0 ? (
          <div className="grid items-start gap-5 xl:grid-cols-2">
            {files.resumes.map((resume, index) => (
              <TexteIACard
                key={resume.id}
                texte={resume}
                nature="Résumé de débat"
                actionValider={validerResume}
                actionRejeter={rejeterResume}
                index={index}
              />
            ))}
          </div>
        ) : (
          <FileVide message="Aucun résumé de débat en attente — les débats terminés ont tous été traités." />
        ))}
    </>
  );
}
