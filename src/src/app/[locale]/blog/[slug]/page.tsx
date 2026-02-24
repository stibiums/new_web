"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar, Eye, Heart, ArrowLeft } from "lucide-react";
import { MarkdownRenderer, TableOfContents } from "@/components/content";
import { Giscus } from "@/components/ui/Giscus";

interface Post {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  content: string;
  contentEn: string | null;
  excerpt: string | null;
  excerptEn: string | null;
  coverImage: string | null;
  tags: string | null;
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

export default function BlogPostPage() {
  const t = useTranslations("blog");
  const tCommon = useTranslations("common");
  const params = useParams();
  const locale = params.locale as string;
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Record view on page load
  useEffect(() => {
    fetch(`/api/views/${slug}`, { method: "POST" }).catch(() => {});
  }, [slug]);

  // 恢复点赞状态（当前 IP 是否已点赞）
  useEffect(() => {
    fetch(`/api/likes/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.data) {
          setLiked(data.data.liked);
          setPost((prev) => prev ? { ...prev, likes: data.data.likes } : prev);
        }
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${slug}`);
        const data = await res.json();
        if (res.ok) {
          setPost(data.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to fetch post:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
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
      if (res.ok && post) {
        setPost({ ...post, likes: data.data.likes });
        setLiked(data.data.liked);
      }
    } catch (err) {
      console.error("Failed to like:", err);
    } finally {
      setLikeLoading(false);
    }
  };

  const getTitle = (p: Post) => {
    return locale === "en" && p.titleEn ? p.titleEn : p.title;
  };

  const getContent = (p: Post) => {
    return locale === "en" && p.contentEn ? p.contentEn : p.content;
  };

  const getTags = (p: Post) => {
    if (!p.tags) return [];
    return p.tags.split(",").map((tag) => tag.trim());
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href={`/${locale}/blog`}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {tCommon("back")}
        </Link>
        <div className="space-y-4">
          <div className="h-10 w-3/4 bg-muted rounded animate-pulse" />
          <div className="flex gap-4 text-muted-foreground">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-96 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">文章不存在</h1>
        <Link href={`/${locale}/blog`} className="text-primary hover:underline">
          返回博客列表
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8 items-start relative">
      {/* TOC Sidebar (Left) */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-24">
        <TableOfContents content={getContent(post)} />
      </aside>

      {/* Main Content (Centered) */}
      <article className="flex-1 min-w-0 w-full max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href={`/${locale}/blog`}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {tCommon("back")}
        </Link>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{getTitle(post)}</h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {post.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(post.publishedAt).toLocaleDateString()}
              </span>
            )}
            {post.views > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.views}
              </span>
            )}
          </div>

          {getTags(post).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {getTags(post).map((tag) => (
                <span key={tag} className="px-2 py-1 rounded bg-muted text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={post.coverImage}
              alt={getTitle(post)}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Content */}
        <MarkdownRenderer
          content={getContent(post)}
          slugToPath={Object.fromEntries([
            ...post.links.map((l) => [
              l.target.slug,
              `/${l.target.type === "NOTE" ? "notes" : "blog"}/${l.target.slug}`,
            ]),
            ...post.backlinks.map((l) => [
              l.source.slug,
              `/${l.source.type === "NOTE" ? "notes" : "blog"}/${l.source.slug}`,
            ]),
          ])}
        />

        {/* Like */}
        <div className="flex justify-end mt-8">
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
            {post.likes > 0 && <span className="opacity-60">{post.likes}</span>}
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
