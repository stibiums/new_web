"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ExternalLink, Copy, Check } from "lucide-react";

interface Publication {
  id: string;
  title: string;
  authors: string;
  venue: string | null;
  year: number | null;
  doi: string | null;
  url: string | null;
  abstract: string | null;
}

export default function PublicationsPage() {
  const t = useTranslations("publications");
  const params = useParams();
  const locale = params.locale as string;
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const res = await fetch("/api/publications");
        const data = await res.json();
        if (res.ok) {
          setPublications(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch publications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublications();
  }, []);

  const copyBibtex = (pub: Publication) => {
    // Generate BibTeX entry
    const key = `${pub.authors.split(",")[0]?.trim() || "unknown"}${pub.year || ""}`;
    const bibtex = `@article{${key.replace(/\s+/g, "_").toLowerCase()},
  title = {${pub.title}},
  author = {${pub.authors}},
  journal = {${pub.venue || ""}},
  year = {${pub.year || ""}},
  doi = {${pub.doi || ""}}
}`;
    navigator.clipboard.writeText(bibtex);
    setCopiedId(pub.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-6 rounded-lg border border-border">
              <div className="h-6 w-3/4 bg-muted rounded mb-4 animate-pulse" />
              <div className="h-4 w-1/2 bg-muted rounded mb-2 animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      {publications.length === 0 ? (
        <p className="text-muted-foreground">{t("noResults")}</p>
      ) : (
        <div className="space-y-8">
          {publications.map((pub) => (
            <article
              key={pub.id}
              className="p-6 rounded-lg border border-border"
            >
              <h2 className="text-lg font-semibold mb-2">{pub.title}</h2>

              <p className="text-muted-foreground text-sm mb-2">
                <span className="font-medium">{t("authors")}:</span> {pub.authors}
              </p>

              {(pub.venue || pub.year) && (
                <p className="text-muted-foreground text-sm mb-4">
                  {pub.venue && <span>{pub.venue}</span>}
                  {pub.venue && pub.year && <span>, </span>}
                  {pub.year && <span>{pub.year}</span>}
                </p>
              )}

              {pub.abstract && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1">{t("abstract")}</h3>
                  <p className="text-sm text-muted-foreground">{pub.abstract}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                {pub.url && (
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t("link")}
                  </a>
                )}
                {pub.doi && (
                  <a
                    href={`https://doi.org/${pub.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    DOI: {pub.doi}
                  </a>
                )}
                <button
                  onClick={() => copyBibtex(pub)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {copiedId === pub.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      {t("bibtexCopied")}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {t("copyBibtex")}
                    </>
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
