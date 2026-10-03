import React from "react";
import fs from "node:fs";
import path from "node:path";
import { AdminDashboard, type AdminActRow, type AdminFreshness } from "../../components/admin-dashboard";
import { feedbackStore } from "../api/feedback/route";
import { CORE_ACTS_REGISTRY } from "../../kb/core-acts-registry";
import { geminiConfig } from "../../config/models";

export const metadata = {
  title: "Panel administratora — czypodpisac.pl",
  description: "Konfiguracja modeli, zgłoszenia użytkowników i stan bazy prawnej.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Odczyt wyniku ostatniego uruchomienia scripts/check-law-updates.ts (docs/eval/law-freshness-audit.json). Brak pliku = brak danych. */
function readFreshnessAudit(): AdminFreshness | null {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "docs/eval/law-freshness-audit.json"), "utf8");
    const audit = JSON.parse(raw) as {
      timestamp?: string;
      totalAudited?: number;
      upToDateCount?: number;
      needsReviewCount?: number;
      repealedCount?: number;
    };
    if (typeof audit.timestamp !== "string" || typeof audit.totalAudited !== "number") return null;
    return {
      checkedAt: audit.timestamp,
      totalAudited: audit.totalAudited,
      upToDateCount: audit.upToDateCount ?? 0,
      needsReviewCount: audit.needsReviewCount ?? 0,
      repealedCount: audit.repealedCount ?? 0,
    };
  } catch {
    return null;
  }
}

/** "DU/2026/880" → "Dz.U. 2026 poz. 880"; brak ELI = null (nie zgadujemy). */
function formatEli(eli: string | undefined): string | null {
  if (!eli) return null;
  const m = /^DU\/(\d{4})\/(\d+)$/.exec(eli);
  return m ? `Dz.U. ${m[1]} poz. ${m[2]}` : eli;
}

export default function AdminPage() {
  const acts: AdminActRow[] = CORE_ACTS_REGISTRY.map((a) => ({
    id: a.id,
    title: a.shortTitle,
    unifiedText: formatEli(a.latestKnownUnifiedEli),
  }));

  return (
    <div className="bg-slate-50 min-h-screen">
      <AdminDashboard
        initialDisputes={feedbackStore}
        acts={acts}
        freshness={readFreshnessAudit()}
        models={{
          configured: Boolean(geminiConfig.projectId),
          region: geminiConfig.region,
          fastModel: geminiConfig.fastModel,
          flagshipModel: geminiConfig.flagshipModel,
          verifierModel: geminiConfig.verifierModel,
        }}
      />
    </div>
  );
}
