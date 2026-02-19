"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar, Eye, ArrowRight } from "lucide-react";

interface Post {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  excerpt: string | null;
  excerptEn: string | null;
  coverImage: string | null;
  tags: string | null;
  category: string | null;
  publishedAt: string | null;
  views: number;
}

export default function BlogPage() {
  const t = useTranslations("blog");
  const params = useParams();
  const locale = params.locale as string;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/posts?type=BLOG&published=true&limit=20");
        const data = await res.json();
        if (res.ok) {
          setPosts(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const getTitle = (post: Post) => {
    return locale === "en" && post.titleEn ? post.titleEn : post.title;
  };

  const getExcerpt = (post: Post) => {
    const excerpt = locale === "en" ? post.excerptEn : post.excerpt;
    return excerpt || "";
  };

  const getTags = (post: Post) => {
    if (!post.tags) return [];
    return post.tags.split(",").map((tag) => tag.trim());
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-6 rounded-lg border border-border">
              <div className="h-6 w-3/4 bg-muted rounded mb-4 animate-pulse" />
              <div className="h-4 w-full bg-muted rounded mb-2 animate-pulse" />
              <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">{t("noResults")}</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                {post.publishedAt && (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                  </>
                )}
                {post.views > 0 && (
                  <>
                    <span className="mx-2">·</span>
                    <Eye className="w-4 h-4" />
                    <span>{post.views}</span>
                  </>
                )}
              </div>

              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-semibold mb-3 hover:text-primary transition-colors">
                  {getTitle(post)}
                </h2>
              </Link>

              {getExcerpt(post) && (
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {getExcerpt(post)}
                </p>
              )}

              {getTags(post).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {getTags(post).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded bg-muted text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {t("readMore")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
