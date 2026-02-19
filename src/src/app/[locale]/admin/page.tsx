import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">欢迎回来</h1>
        <p className="text-[var(--color-muted-foreground)] mt-2">
          这里是管理后台的控制面板
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 rounded-lg bg-[var(--color-muted)]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[var(--color-primary)]/10">
              <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)]">文章</p>
              <p className="text-2xl font-semibold">0</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-[var(--color-muted)]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[var(--color-primary)]/10">
              <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)]">笔记</p>
              <p className="text-2xl font-semibold">0</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-[var(--color-muted)]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[var(--color-primary)]/10">
              <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted-foreground)]">项目</p>
              <p className="text-2xl font-semibold">0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-lg bg-[var(--color-muted)]">
        <h2 className="text-lg font-semibold mb-4">快速操作</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/${locale}/admin/posts/new`}
            className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            新建文章
          </a>
          <a
            href={`/${locale}/admin/notes/new`}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-muted)] transition-colors"
          >
            新建笔记
          </a>
          <a
            href={`/${locale}/admin/projects/new`}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-muted)] transition-colors"
          >
            新建项目
          </a>
        </div>
      </div>
    </div>
  );
}
