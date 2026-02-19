"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Settings } from "lucide-react";

export function AuthButton() {
  const { data: session, status } = useSession();
  const t = useTranslations();
  const locale = useLocale();

  if (status === "loading") {
    return null;
  }

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={`/${locale}/admin`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
          title={t("nav.admin")}
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">{t("nav.admin")}</span>
        </a>
        <button
          onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
          className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          {t("common.logout")}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
    >
      {t("common.login")}
    </button>
  );
}
