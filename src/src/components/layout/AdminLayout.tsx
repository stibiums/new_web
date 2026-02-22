"use client";

import { useState } from "react";
import { usePathname } from "@/i18n/routing";
import { Card } from "@/components/ui/Card";
import { AdminSidebar, AdminSidebarToggle } from "./AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/** 匹配编辑页路由——这些页面需要全屏无 Card 包装 */
function isEditorPage(pathname: string) {
  return /\/admin\/(posts|notes|projects)\/[^/]+\/edit/.test(pathname);
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const editorMode = isEditorPage(pathname);

  return (
    <div className={editorMode ? "fixed inset-0 z-50 overflow-hidden bg-[var(--color-background)]" : "min-h-screen bg-[var(--color-muted)]"}>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className={editorMode ? "lg:pl-64 h-full flex flex-col overflow-hidden" : "lg:pl-64"}>
        {/* Mobile header */}
        <header className="sticky top-0 z-30 h-16 bg-[var(--color-card)] border-b border-[var(--color-border)] flex items-center px-4 lg:hidden">
          <AdminSidebarToggle onClick={() => setSidebarOpen(true)} />
          <span className="ml-4 font-semibold">管理后台</span>
        </header>

        {editorMode ? (
          /* 编辑页：全屏无内边距无 Card */
          <div className="flex-1 min-h-0 overflow-hidden">
            {children}
          </div>
        ) : (
          /* 普通页：保留原有 Card + padding */
          <main className="p-4 lg:p-8">
            <Card className="p-6 lg:p-8">
              {children}
            </Card>
          </main>
        )}
      </div>
    </div>
  );
}
