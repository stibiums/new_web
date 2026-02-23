"use client";

import { useTranslations } from "next-intl";
import { Network } from "lucide-react";
import { KnowledgeGraph } from "@/components/graph/KnowledgeGraph";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function GraphPage() {
  const t = useTranslations("graph");
  const tCommon = useTranslations("common");
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Link
        href={`/${locale}/notes`}
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {tCommon("back")}
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Network className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
        </div>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ height: "75vh", minHeight: 600 }}>
        <KnowledgeGraph locale={locale} />
      </div>
    </div>
  );
}
