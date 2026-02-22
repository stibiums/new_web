"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar, Eye, Heart, ArrowLeft, Share2 } from "lucide-react";
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
    const recordView = async () => {
      try {
        await fetch(`/api/views/${slug}`, { method: "POST" });
      } catch (err) {
        console.error("Failed to record view:", err);
      }
    };
    recordView();
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post ? getTitle(post) : "",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
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
    <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8 items-start">
      <article className="flex-1 min-w-0 w-full max-w-4xl">
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
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                liked ? "text-red-500" : ""
              }`}
            >
              <Heart
                className={`w-4 h-4 ${liked ? "fill-current animate-pulse" : ""}`}
              />
              {post.likes}
            </button>
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
        <MarkdownRenderer content={getContent(post)} />

        {/* Share */}
        <div className="flex justify-end gap-4 mt-8 pt-8 border-t border-border">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            分享
          </button>
        </div>

        {/* Giscus Comments */}
        <Giscus />
      </article>

      {/* TOC Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <TableOfContents content={getContent(post)} />
      </aside>
    </div>
  );
}
