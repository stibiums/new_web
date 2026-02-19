"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar, ArrowLeft, ArrowRight } from "lucide-react";

interface Note {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  content: string;
  contentEn: string | null;
  category: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  links: { target: { id: string; slug: string; title: string; titleEn: string | null } }[];
  backlinks: { source: { id: string; slug: string; title: string; titleEn: string | null } }[];
}

export default function NotePage() {
  const t = useTranslations("notes");
  const params = useParams();
  const locale = params.locale as string;
  const slug = params.slug as string;
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await fetch(`/api/posts/${slug}`);
        const data = await res.json();
        if (res.ok) {
          setNote(data.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to fetch note:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [slug]);

  const getTitle = (n: Note) => {
    return locale === "en" && n.titleEn ? n.titleEn : n.title;
  };

  const getContent = (n: Note) => {
    return locale === "en" && n.contentEn ? n.contentEn : n.content;
  };

  const getLinkedTitle = (item: { title: string; titleEn: string | null }) => {
    return locale === "en" && item.titleEn ? item.titleEn : item.title;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href={`/${locale}/notes`}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back")}
        </Link>
        <div className="space-y-4">
          <div className="h-10 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-96 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">笔记不存在</h1>
        <Link href="/notes" className="text-primary hover:underline">
          返回笔记列表
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      {/* Back link */}
      <Link
        href="/notes"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("back")}
      </Link>

      {/* Breadcrumb */}
      {note.category && (
        <div className="text-sm text-muted-foreground mb-4">
          {note.category}
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{getTitle(note)}</h1>

        {note.publishedAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {new Date(note.publishedAt).toLocaleDateString()}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
        <div className="whitespace-pre-wrap">{getContent(note)}</div>
      </div>

      {/* Related Notes - 5.10 */}
      {(note.links.length > 0 || note.backlinks.length > 0) && (
        <div className="pt-8 border-t border-border">
          <h3 className="text-lg font-semibold mb-4">相关笔记</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {note.links.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  引用的笔记
                </h4>
                <div className="space-y-2">
                  {note.links.map((link) => (
                    <Link
                      key={link.target.slug}
                      href={`/${locale}/notes/${link.target.slug}`}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>{getLinkedTitle(link.target)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {note.backlinks.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  引用此笔记的笔记
                </h4>
                <div className="space-y-2">
                  {note.backlinks.map((link) => (
                    <Link
                      key={link.source.slug}
                      href={`/${locale}/notes/${link.source.slug}`}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>{getLinkedTitle(link.source)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
