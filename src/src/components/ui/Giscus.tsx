"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface GiscusProps {
  mapping?: "pathname" | "url" | "title" | "og:title" | "specific" | "number";
}

export function Giscus({ mapping = "pathname" }: GiscusProps) {
  const t = useTranslations("blog");
  const params = useParams();
  const locale = params.locale as string;
  const ref = useRef<HTMLDivElement>(null);

  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

  // Check if Giscus is configured
  if (!repo || !repoId || !category || !categoryId) {
    return (
      <div className="mt-12 pt-8 border-t border-border">
        <h3 className="text-lg font-semibold mb-4">{t("comments") || "评论"}</h3>
        <div className="p-4 text-muted-foreground text-sm bg-muted rounded-lg">
          {t("commentsNotConfigured") || "评论功能尚未配置，请在环境变量中设置 Giscus 相关配置。"}
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!ref.current) return;

    // Create script element
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", mapping);
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", "preferred_color_scheme");
    script.setAttribute("data-lang", locale === "en" ? "en" : "zh-CN");
    script.setAttribute("data-loading", "lazy");
    script.crossOrigin = "anonymous";
    script.async = true;

    // Clear previous content and append new script
    ref.current.innerHTML = "";
    ref.current.appendChild(script);

    return () => {
      if (ref.current) {
        ref.current.innerHTML = "";
      }
    };
  }, [repo, repoId, category, categoryId, mapping, locale]);

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <h3 className="text-lg font-semibold mb-4">{t("comments") || "评论"}</h3>
      <div ref={ref} className="min-h-[200px]" />
    </div>
  );
}
