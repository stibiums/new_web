import Link from "next/link";
import { Github, Mail, Linkedin, Youtube, Tv } from "lucide-react";

export function Footer({ 
  copyright, 
  githubUrl, 
  email,
  linkedinUrl,
  youtubeUrl,
  bilibiliUrl,
  twitterUrl
}: { 
  copyright?: string; 
  githubUrl?: string; 
  email?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  bilibiliUrl?: string;
  twitterUrl?: string;
}) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Social Links */}
          <div className="flex items-center gap-4">
            {(githubUrl || "https://github.com/stibiums") && (
              <a
                href={githubUrl || "https://github.com/stibiums"}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            )}
            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            )}
            {youtubeUrl && (
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            )}
            {bilibiliUrl && (
              <a
                href={bilibiliUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Bilibili"
              >
                <Tv className="w-5 h-5" />
              </a>
            )}
            {twitterUrl && (
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
            {(email || "contact@stibiums.top") && (
              <a
                href={`mailto:${email || "contact@stibiums.top"}`}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            )}
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            {copyright || `© ${currentYear} Stibiums. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
