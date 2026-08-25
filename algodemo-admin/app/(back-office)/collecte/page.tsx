import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { PropositionCard } from "@/components/collecte/PropositionCard";
import { TriangulationCard } from "@/components/collecte/TriangulationCard";
import { listPropositions, listTriangulation } from "@/lib/data/collecte";
import type { StatutProposition } from "@/lib/domain/types";

export const metadata = { title: "Collecte & veille" };

const TAB_KEYS = ["a-valider", "triangulation", "traitees"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const isTabKey = (value: string | undefined): value is TabKey =>
  TAB_KEYS.includes(value as TabKey);

export default async function CollectePage({
  searchParams,
}: {
  // Next 16 : `searchParams` est asynchrone.
  searchParams: Promise<{ onglet?: string }>;
}) {
  const { onglet } = await searchParams;
  const activeTab: TabKey = isTabKey(onglet) ? onglet : "a-valider";

  const [propositions, triangulation] = await Promise.all([
    listPropositions(),
    listTriangulation(),
  ]);

  const parStatut = (statut: StatutProposition) =>
    propositions.filter((p) => p.statut === statut);

  const enAttente = parStatut("EN_ATTENTE");
  const traitees = propositions.filter((p) => p.statut !== "EN_ATTENTE");

  return (
    <>
      <PageHeader
        title="Collecte & veille"
        description="Chaque chiffre collecté attend une validation humaine avant d'apparaître dans la fiche pays. Vérifiez la citation et la source avant de trancher."
        actions={
          <Button href="/collecte/sources" variant="outline">
            Liste blanche des sources
          </Button>
        }
      />

      <Tabs
        activeKey={activeTab}
        hrefForTab={(key) => `/collecte?onglet=${key}`}
        className="mb-6"
        tabs={[
          { key: "a-valider", label: "À valider", count: enAttente.length },
          {
            key: "triangulation",
            label: "Triangulation",
            count: triangulation.length,
          },
          { key: "traitees", label: "Traitées", count: traitees.length },
        ]}
      />

      {activeTab === "a-valider" && (
        <>
          <div className="mb-5 flex items-start gap-3 rounded-xl bg-primary-pale p-4 ring-1 ring-primary/15">
            <ShieldCheck
              className="mt-0.5 size-[18px] shrink-0 text-primary"
              aria-hidden
            />
            <div>
              <p className="text-[15px] font-bold text-primary">
                Rien ne se publie sans validation
              </p>
              <p className="mt-0.5 text-[14px] leading-relaxed text-ink-muted">
                Les valeurs proviennent de sources en liste blanche, puis d&apos;une
                extraction citée. Valider une proposition l&apos;inscrit dans la
                fiche pays ; la rejeter la conserve en base pour la traçabilité.
              </p>
            </div>
          </div>

          {enAttente.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {enAttente.map((proposition, index) => (
                <PropositionCard
                  key={proposition.id}
                  proposition={proposition}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-surface p-12 text-center text-[14px] text-ink-muted ring-1 ring-hairline">
              Aucune proposition en attente. Lancez une collecte ou ingérez un
              document pour alimenter cette file.
            </p>
          )}
        </>
      )}

      {activeTab === "triangulation" && (
        <>
          {triangulation.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {triangulation.map((ligne, index) => (
                <TriangulationCard
                  key={`${ligne.indicateur}-${index}`}
                  ligne={ligne}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-surface p-12 text-center text-[14px] text-ink-muted ring-1 ring-hairline">
              Aucun indicateur collecté pour l&apos;instant.
            </p>
          )}
        </>
      )}

      {activeTab === "traitees" && (
        <>
          {traitees.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {traitees.map((proposition, index) => (
                <PropositionCard
                  key={proposition.id}
                  proposition={proposition}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-surface p-12 text-center text-[14px] text-ink-muted ring-1 ring-hairline">
              Aucune proposition n&apos;a encore été traitée.
            </p>
          )}
        </>
      )}
    </>
  );
}
