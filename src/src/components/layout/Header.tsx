"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Menu, X, Search } from "lucide-react";

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation items with locale prefix
  const navItems = [
    { href: `/${locale}`, labelKey: "nav.home" },
    { href: `/${locale}/blog`, labelKey: "nav.blog" },
    { href: `/${locale}/notes`, labelKey: "nav.notes" },
    { href: `/${locale}/projects`, labelKey: "nav.projects" },
    { href: `/${locale}/publications`, labelKey: "nav.publications" },
    { href: `/${locale}/resume`, labelKey: "nav.resume" },
  ];

  const toggleLanguage = () => {
    const newLocale = locale === "zh" ? "en" : "zh";
    const currentPath = pathname;
    // Remove current locale prefix and add new one
    const pathWithoutLocale = currentPath.replace(/^\/(zh|en)/, "");
    window.location.href = `/${newLocale}${pathWithoutLocale || "/"}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-xl font-bold text-primary hover:text-primary-hover transition-colors"
        >
          <span className="font-mono">Stibiums</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <button
            onClick={() => document.dispatchEvent(new CustomEvent("open-search"))}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
          >
            {locale === "zh" ? "EN" : "中"}
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="flex flex-col py-4 px-4 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "bg-muted text-primary"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
