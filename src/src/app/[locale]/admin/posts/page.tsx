"use client";

import { useState, useEffect } from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "sonner";

interface Post {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  type: string;
  published: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export default function PostsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [limit] = useState(10);

  const fetchPosts = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
        type: "BLOG",
      });
      if (search) params.append("search", search);

      const res = await fetch(`/api/admin/posts?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch posts");
      }

      setPosts(data.data);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast.success("Post deleted successfully");
      fetchPosts(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">文章管理</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            管理您的博客文章
          </p>
        </div>
        <Link 
          href="/admin/posts/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] h-10 px-4 text-base"
        >
          新建文章
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>文章列表</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-4 flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索文章..."
              className="max-w-xs"
            />
            <Button type="submit" variant="outline">
              搜索
            </Button>
          </form>

          {loading ? (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">
              加载中...
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">
              暂无文章
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left py-3 px-4 font-medium">标题</th>
                      <th className="text-left py-3 px-4 font-medium">类型</th>
                      <th className="text-left py-3 px-4 font-medium">状态</th>
                      <th className="text-left py-3 px-4 font-medium">浏览量</th>
                      <th className="text-left py-3 px-4 font-medium">创建时间</th>
                      <th className="text-right py-3 px-4 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr
                        key={post.id}
                        className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)]"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium">{post.title}</div>
                          {post.titleEn && (
                            <div className="text-sm text-[var(--color-muted-foreground)]">
                              {post.titleEn}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={post.type === "BLOG" ? "default" : "secondary"}>
                            {post.type === "BLOG" ? "博客" : "笔记"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={post.published ? "success" : "outline"}>
                            {post.published ? "已发布" : "草稿"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{post.views}</td>
                        <td className="py-3 px-4 text-sm text-[var(--color-muted-foreground)]">
                          {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link 
                              href={`/admin/posts/${post.id}/edit`}
                              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 bg-transparent hover:bg-[var(--color-muted)] text-[var(--color-foreground)] h-8 px-3 text-sm"
                            >
                              编辑
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(post.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              删除
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPosts(page - 1)}
                    disabled={page <= 1}
                  >
                    上一页
                  </Button>
                  <span className="text-sm text-[var(--color-muted-foreground)]">
                    第 {page} / {totalPages} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPosts(page + 1)}
                    disabled={page >= totalPages}
                  >
                    下一页
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
