import type { Metadata } from "next";
import { Inter, Noto_Sans_SC, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from "@/components/theme";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { prisma } from "@/lib/prisma";
import { getThemeCss } from "@/lib/themes";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Stibiums - 个人学术网站",
  description: "计算机科学研究生 | 全栈开发者",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();
  
  // 获取主题配置
  let themeCss = "";
  try {
    const themeConfig = await prisma.siteConfig.findUnique({
      where: { key: "theme_color" }
    });
    themeCss = getThemeCss(themeConfig?.value);
  } catch (error) {
    console.error("Failed to fetch theme config:", error);
    themeCss = getThemeCss("violet"); // fallback
  }

  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body
        className={`${inter.variable} ${notoSansSC.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <NextIntlClientProvider messages={messages}>
              {children}
            </NextIntlClientProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
