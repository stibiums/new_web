"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const t = useTranslations("common");

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-9xl font-bold text-primary/20">404</h1>
      <h2 className="text-2xl font-semibold mt-4 mb-2">{t("notFound")}</h2>
      <p className="text-muted-foreground mb-8">
        抱歉，您访问的页面不存在
      </p>

      <div className="flex gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
        >
          <Home className="w-5 h-5" />
          返回首页
        </Link>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t("back")}
        </button>
      </div>
    </div>
  );
}
