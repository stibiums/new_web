"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar, Eye, Heart, ArrowLeft, ArrowRight } from "lucide-react";
import { MarkdownRenderer, TableOfContents } from "@/components/content";
import { Giscus } from "@/components/ui/Giscus";

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
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  links: { target: { id: string; slug: string; title: string; titleEn: string | null; type: string } }[];
  backlinks: { source: { id: string; slug: string; title: string; titleEn: string | null; type: string } }[];
}

export default function NotePage() {
  const t = useTranslations("notes");
  const tCommon = useTranslations("common");
  const params = useParams();
  const locale = params.locale as string;
  const slug = params.slug as string;
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // 记录浏览量（笔记类型）
  useEffect(() => {
    fetch(`/api/views/${slug}?type=note`, { method: "POST" }).catch(() => {});
  }, [slug]);

  // 获取点赞状态（含当前 IP 是否已点赞）
  useEffect(() => {
    fetch(`/api/likes/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.data) {
          setLiked(data.data.liked);
          // 同步 note 中的 likes 数（若已加载完毕可直接更新）
          setNote((prev) => prev ? { ...prev, likes: data.data.likes } : prev);
        }
      })
      .catch(() => {});
  }, [slug]);

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const action = liked ? "unlike" : "like";
      const res = await fetch(`/api/likes/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && note) {
        setNote({ ...note, likes: data.data.likes });
        setLiked(data.data.liked);
      }
    } catch (err) {
      console.error("Failed to like:", err);
    } finally {
      setLikeLoading(false);
    }
  };

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
          {tCommon("back")}
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
        <Link href={`/${locale}/notes`} className="text-primary hover:underline">
          返回笔记列表
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8 items-start relative">
      {/* TOC Sidebar (Left) */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-24">
        <TableOfContents content={getContent(note)} />
      </aside>

      {/* Main Content (Centered) */}
      <article className="flex-1 min-w-0 w-full max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href={`/${locale}/notes`}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {tCommon("back")}
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

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {note.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(note.publishedAt).toLocaleDateString()}
              </span>
            )}
            {note.views > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {note.views}
              </span>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="mb-12">
          <MarkdownRenderer
            content={getContent(note)}
            slugToPath={Object.fromEntries([
              ...note.links.map((l) => [
                l.target.slug,
                `/${l.target.type === "NOTE" ? "notes" : "blog"}/${l.target.slug}`,
              ]),
              ...note.backlinks.map((l) => [
                l.source.slug,
                `/${l.source.type === "NOTE" ? "notes" : "blog"}/${l.source.slug}`,
              ]),
            ])}
          />
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

        {/* 点赞按钮（评论区上方右对齐） */}
        <div className="flex justify-end mt-8 mb-8">
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`group flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 text-sm select-none
              ${
                liked
                  ? "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-500"
                  : "border-border hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 text-muted-foreground hover:text-red-500"
              } ${likeLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <Heart
              className={`w-4 h-4 transition-transform duration-200 ${
                liked ? "fill-current scale-110" : "group-hover:scale-110"
              }`}
            />
            <span>{liked ? "已点赞" : "点赞"}</span>
            {note.likes > 0 && <span className="opacity-60">{note.likes}</span>}
          </button>
        </div>

        {/* Giscus Comments */}
        <Giscus />
      </article>

      {/* Right Spacer (to balance the layout and keep the article centered) */}
      <div className="hidden xl:block w-64 shrink-0"></div>
    </div>
  );
}
