"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar, ArrowRight } from "lucide-react";

interface Note {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  category: string | null;
  tags: string | null;
  publishedAt: string | null;
}

export default function NotesPage() {
  const t = useTranslations("notes");
  const params = useParams();
  const locale = params.locale as string;
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch("/api/posts?type=NOTE&published=true&limit=50");
        const data = await res.json();
        if (res.ok) {
          setNotes(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch notes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const getTitle = (note: Note) => {
    return locale === "en" && note.titleEn ? note.titleEn : note.title;
  };

  const getTags = (note: Note) => {
    if (!note.tags) return [];
    return note.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  };

  // Group notes by category
  const groupedNotes = notes.reduce((acc, note) => {
    const category = note.category || "未分类";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  const categories = Object.keys(groupedNotes).sort();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
        <div className="space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="h-6 w-32 bg-muted rounded mb-4 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      {notes.length === 0 ? (
        <p className="text-muted-foreground">{t("noResults")}</p>
      ) : (
        <div className="space-y-10">
          {categories.map((category) => (
            <section key={category}>
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-border">
                {category}
              </h2>
              <div className="space-y-3">
                {groupedNotes[category].map((note) => (
                  <Link
                    key={note.id}
                    href={`/${locale}/notes/${note.slug}`}
                    className="flex items-start justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      <div className="min-w-0">
                        <span className="font-medium">{getTitle(note)}</span>
                        {getTags(note).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {getTags(note).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {note.publishedAt && (
                      <span className="text-sm text-muted-foreground shrink-0 ml-4 mt-0.5">
                        {new Date(note.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
