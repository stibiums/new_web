"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar, Eye, ArrowRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Pagination,
} from "@/components/ui";

const PAGE_SIZE = 10;

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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchPosts = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/posts?type=BLOG&published=true&page=${p}&limit=${PAGE_SIZE}`
      );
      const data = await res.json();
      if (res.ok) {
        setPosts(data.data);
        setTotal(data.total ?? 0);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(page);
  }, [page, fetchPosts]);

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getTitle = (post: Post) =>
    locale === "en" && post.titleEn ? post.titleEn : post.title;

  const getExcerpt = (post: Post) => {
    const excerpt = locale === "en" ? post.excerptEn : post.excerpt;
    return excerpt || "";
  };

  const getTags = (post: Post): string[] => {
    if (!post.tags) return [];
    return post.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-[var(--spacing-list-max)] mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
        <div className="space-y-5">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-1/3 bg-muted rounded animate-pulse mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[var(--spacing-list-max)] mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">{t("noResults")}</p>
      ) : (
        <>
          <div className="space-y-5">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="hover:border-primary/50 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-1">
                    {post.publishedAt && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(post.publishedAt).toLocaleDateString(
                          locale === "zh" ? "zh-CN" : "en-US"
                        )}
                      </span>
                    )}
                    {post.views > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        {post.views} {t("views")}
                      </span>
                    )}
                    {post.category && (
                      <Badge variant="outline" className="text-xs">
                        {post.category}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl leading-snug">
                    <Link
                      href={`/${locale}/blog/${post.slug}`}
                      className="hover:text-primary transition-colors"
                    >
                      {getTitle(post)}
                    </Link>
                  </CardTitle>
                </CardHeader>

                {getExcerpt(post) && (
                  <CardContent className="pt-0 pb-3">
                    <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                      {getExcerpt(post)}
                    </CardDescription>
                  </CardContent>
                )}

                <CardFooter className="pt-0 flex items-center justify-between flex-wrap gap-2">
                  {getTags(post).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {getTags(post).map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span />
                  )}
                  <Link
                    href={`/${locale}/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline shrink-0"
                  >
                    {t("readMore")}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
