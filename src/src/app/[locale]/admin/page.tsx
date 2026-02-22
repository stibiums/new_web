"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/routing";

interface Stats {
  posts: { total: number; published: number };
  notes: { total: number; published: number };
  projects: { total: number; published: number };
  publications: { total: number };
  views: { total: number; today: number };
  likes: { total: number };
  recentPosts: {
    id: string;
    title: string;
    titleEn: string | null;
    views: number;
    likes: number;
    publishedAt: Date | null;
  }[];
  recentProjects: {
    id: string;
    title: string;
    titleEn: string | null;
    createdAt: Date;
  }[];
}

export default function AdminDashboard() {
  const params = useParams();
  const locale = params.locale as string;
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        if (res.ok) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">欢迎回来</h1>
          <p className="text-[var(--color-muted-foreground)] mt-2">
            这里是管理后台的控制面板
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-colss-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-[var(--color-muted)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "文章",
      value: stats?.posts.total || 0,
      published: stats?.posts.published || 0,
      href: "/admin/posts",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: "笔记",
      value: stats?.notes.total || 0,
      published: stats?.notes.published || 0,
      href: "/admin/notes",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      label: "项目",
      value: stats?.projects.total || 0,
      published: stats?.projects.published || 0,
      href: "/admin/projects",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
    },
    {
      label: "出版物",
      value: stats?.publications.total || 0,
      href: "/admin/publications",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
  ];

  const engagementCards = [
    {
      label: "总浏览量",
      value: stats?.views.total || 0,
      subtitle: `今日 ${stats?.views.today || 0}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      label: "总点赞数",
      value: stats?.likes.total || 0,
      subtitle: "",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">欢迎回来</h1>
        <p className="text-[var(--color-muted-foreground)] mt-2">
          这里是管理后台的控制面板
        </p>
      </div>

      {/* Content Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="p-6 rounded-lg bg-[var(--color-muted)] hover:bg-[var(--color-muted)]/80 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {card.label}
                </p>
                <p className="text-2xl font-semibold">{card.value}</p>
                {"published" in card && (
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    已发布: {card.published}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Engagement Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {engagementCards.map((card) => (
          <div
            key={card.label}
            className="p-6 rounded-lg bg-[var(--color-muted)]"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {card.label}
                </p>
                <p className="text-2xl font-semibold">{card.value.toLocaleString()}</p>
                {card.subtitle && (
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {card.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Posts */}
      <div className="rounded-lg border border-[var(--color-border)]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold">最近文章</h2>
          <Link
            href="/admin/posts"
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            查看全部
          </Link>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {stats?.recentPosts && stats.recentPosts.length > 0 ? (
            stats.recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/admin/posts/${post.id}/edit`}
                className="flex items-center justify-between p-4 hover:bg-[var(--color-muted)]/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {post.titleEn || post.title}
                  </p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("zh-CN")
                      : "未发布"}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-[var(--color-muted-foreground)]">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {post.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {post.likes}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center text-[var(--color-muted-foreground)]">
              暂无文章
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 rounded-lg bg-[var(--color-muted)]">
        <h2 className="text-lg font-semibold mb-4">快速操作</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/posts/new"
            className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            新建文章
          </Link>
          <Link
            href="/admin/notes/new"
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-card)] transition-colors"
          >
            新建笔记
          </Link>
          <Link
            href="/admin/projects/new"
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-card)] transition-colors"
          >
            新建项目
          </Link>
          <Link
            href="/admin/publications/new"
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-card)] transition-colors"
          >
            新建出版物
          </Link>
        </div>
      </div>
    </div>
  );
}
