import { ShieldCheck } from "lucide-react";
import {
  listContributions,
  listSignalements,
  listVerifications,
} from "@/lib/data/moderation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { ContributionCard } from "@/components/moderation/ContributionCard";
import { SignalementCard } from "@/components/moderation/SignalementCard";
import { VerificationCard } from "@/components/moderation/VerificationCard";

export const metadata = { title: "Modération" };

const TAB_KEYS = ["avis", "signalements", "verification"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const isTabKey = (value: string | undefined): value is TabKey =>
  TAB_KEYS.includes(value as TabKey);

export default async function ModerationPage({
  searchParams,
}: {
  // Next 16 : `searchParams` est asynchrone.
  searchParams: Promise<{ onglet?: string }>;
}) {
  const { onglet } = await searchParams;
  const activeTab: TabKey = isTabKey(onglet) ? onglet : "avis";

  const [contributions, signalements, verifications] = await Promise.all([
    listContributions(),
    listSignalements(),
    listVerifications(),
  ]);

  return (
    <>
      <PageHeader
        title="Modération"
        description="Traitez les avis citoyens, les signalements de terrain et la vérification des contenus avant diffusion."
      />

      <Tabs
        activeKey={activeTab}
        hrefForTab={(key) => `/moderation?onglet=${key}`}
        className="mb-6"
        tabs={[
          { key: "avis", label: "Avis", count: contributions.length },
          { key: "signalements", label: "Signalements", count: signalements.length },
          { key: "verification", label: "Vérification", count: verifications.length },
        ]}
      />

      {activeTab === "avis" && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {contributions.map((contribution, index) => (
            <ContributionCard
              key={contribution.id}
              contribution={contribution}
              index={index}
            />
          ))}
        </div>
      )}

      {activeTab === "signalements" && (
        <div className="grid gap-4 xl:grid-cols-2">
          {signalements.map((signalement, index) => (
            <SignalementCard
              key={signalement.id}
              signalement={signalement}
              index={index}
            />
          ))}
        </div>
      )}

      {activeTab === "verification" && (
        <>
          <div className="mb-5 flex items-start gap-3 rounded-xl bg-primary-pale p-4 ring-1 ring-primary/15">
            <ShieldCheck className="mt-0.5 size-[18px] shrink-0 text-primary" aria-hidden />
            <div>
              <p className="text-[15px] font-bold text-primary">
                Laboratoire de triangulation
              </p>
              <p className="mt-0.5 text-[14px] leading-relaxed text-ink-muted">
                Chaque contenu franchit trois étapes — analyse IA, point focal
                certifié, investigation — avant toute diffusion citoyenne
                (RG-FEED-01).
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {verifications.map((item, index) => (
              <VerificationCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
