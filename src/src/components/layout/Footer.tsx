import Link from "next/link";
import { SocialIcon } from "@/components/ui/SocialIcon";

export interface SocialLink {
  platform: string;
  url: string;
  showOnHome: boolean;
}

export function Footer({ 
  copyright, 
  socialLinks = [],
}: { 
  copyright?: string; 
  socialLinks?: SocialLink[];
}) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Social Links */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label={link.platform}
                title={link.platform}
              >
                <SocialIcon platform={link.platform} className="w-5 h-5" />
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground text-center md:text-left">
            {copyright || `© ${currentYear} Stibiums. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
