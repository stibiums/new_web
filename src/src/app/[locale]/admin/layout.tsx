import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";
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
    redirect(`/${locale}/login`);
  }

  return <AdminLayout>{children}</AdminLayout>;
}
