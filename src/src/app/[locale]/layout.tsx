import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SearchProvider } from '@/components/search/SearchProvider';
import { prisma } from '@/lib/prisma';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  // 获取全局配置
  let siteConfig: Record<string, string> = {};
  try {
    const configs = await prisma.siteConfig.findMany();
    configs.forEach((c) => {
      siteConfig[c.key] = c.value;
    });
  } catch (error) {
    console.error("Failed to fetch site config:", error);
  }

  const siteTitle = locale === "en" && siteConfig.site_title_en ? siteConfig.site_title_en : siteConfig.site_title;
  const copyright = locale === "en" && siteConfig.footer_copyright_en ? siteConfig.footer_copyright_en : siteConfig.footer_copyright;

  let socialLinks = [];
  try {
    if (siteConfig.social_links) {
      socialLinks = JSON.parse(siteConfig.social_links);
    }
  } catch (e) {
    console.error("Failed to parse social links", e);
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex flex-col min-h-screen">
        <Header siteLogo={siteConfig.site_logo} siteTitle={siteTitle} />
        <main className="flex-1">
          {children}
        </main>
        <Footer 
          copyright={copyright} 
          socialLinks={socialLinks}
        />
        <SearchProvider />
      </div>
    </NextIntlClientProvider>
  );
}
