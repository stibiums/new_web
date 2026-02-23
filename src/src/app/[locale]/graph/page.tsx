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
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden" }}>
      {/* 顶部标题栏 */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-background)] shrink-0">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Network className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-semibold leading-tight">{t("title")}</h1>
          <p className="text-xs text-muted-foreground leading-tight">{t("description")}</p>
        </div>
      </div>

      {/* 图谱主体，撑满剩余高度，两侧留白 */}
      <div className="flex-1 min-h-0 overflow-hidden px-6 py-4">
        <div className="w-full h-full rounded-xl overflow-hidden bg-card border border-[var(--color-border)]">
          <KnowledgeGraph locale={locale} />
        </div>
      </div>
    </div>
  );
}
