import { auth } from "@/lib/auth";
import { redirect, routing } from "@/i18n/routing";
import { AdminLayout } from "@/components/layout/AdminLayout";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function AdminLayoutPage({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session) {
    redirect({ href: "/login", locale });
  }

  return <AdminLayout>{children}</AdminLayout>;
}
