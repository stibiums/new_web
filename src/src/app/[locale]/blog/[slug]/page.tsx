"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar, Eye, Heart, ArrowLeft, ArrowRight, Share2 } from "lucide-react";

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
  const params = useParams();
  const locale = params.locale as string;
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
          href="/blog"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back")}
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
        <Link href="/blog" className="text-primary hover:underline">
          返回博客列表
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      {/* Back link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("back")}
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
          <span className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            {post.likes}
          </span>
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
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {/* Render Tiptap JSON content - placeholder for now */}
        <div className="whitespace-pre-wrap">{getContent(post)}</div>
      </div>

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
    </article>
  );
}
