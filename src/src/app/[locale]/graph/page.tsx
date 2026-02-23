"use client";

import { useTranslations } from "next-intl";
import { Network } from "lucide-react";
import { KnowledgeGraph } from "@/components/graph/KnowledgeGraph";
import { useParams } from "next/navigation";

export default function GraphPage() {
  const t = useTranslations("graph");
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 sm:px-8 flex flex-col"
      style={{ height: "calc(100dvh - 4rem)", overflow: "hidden", paddingTop: "1rem", paddingBottom: "1rem", gap: "0.75rem" }}
    >
      {/* 标题栏 */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Network className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-semibold leading-tight">{t("title")}</h1>
          <p className="text-xs text-muted-foreground leading-tight">{t("description")}</p>
        </div>
      </div>
      {/* ── 图谱主体 ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 rounded-xl overflow-hidden bg-card border border-[var(--color-border)]">
        <KnowledgeGraph locale={locale} />
      </div>
    </div>
  );
}
