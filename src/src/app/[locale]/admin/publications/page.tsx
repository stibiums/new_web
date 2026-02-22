"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "sonner";

interface Publication {
  id: string;
  title: string;
  authors: string;
  venue: string | null;
  year: number | null;
  doi: string | null;
  url: string | null;
  bibtex: string | null;
  abstract: string | null;
  sortOrder: number;
  createdAt: string;
}

export default function PublicationsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [limit] = useState(10);

  const fetchPublications = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
      });
      if (search) params.append("search", search);

      const res = await fetch(`/api/admin/publications?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch publications");
      }

      setPublications(data.data);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch publications"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPublications(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this publication?")) return;

    try {
      const res = await fetch(`/api/admin/publications/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast.success("Publication deleted successfully");
      fetchPublications(page);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete"
      );
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            出版物管理
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            管理您的学术出版物
          </p>
        </div>
        <Link 
          href="/admin/publications/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] h-10 px-4 text-base"
        >
          新建出版物
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>出版物列表</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-4 flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索出版物..."
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
          ) : publications.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">
              暂无出版物
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left py-3 px-4 font-medium">标题</th>
                      <th className="text-left py-3 px-4 font-medium">作者</th>
                      <th className="text-left py-3 px-4 font-medium">期刊/会议</th>
                      <th className="text-left py-3 px-4 font-medium">年份</th>
                      <th className="text-left py-3 px-4 font-medium">排序</th>
                      <th className="text-left py-3 px-4 font-medium">创建时间</th>
                      <th className="text-right py-3 px-4 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publications.map((pub) => (
                      <tr
                        key={pub.id}
                        className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)]"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium">{pub.title}</div>
                          {pub.doi && (
                            <div className="text-xs text-[var(--color-muted-foreground)]">
                              DOI: {pub.doi}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-[var(--color-muted-foreground)] max-w-xs truncate">
                          {pub.authors}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {pub.venue || "-"}
                        </td>
                        <td className="py-3 px-4">{pub.year || "-"}</td>
                        <td className="py-3 px-4">{pub.sortOrder}</td>
                        <td className="py-3 px-4 text-sm text-[var(--color-muted-foreground)]">
                          {new Date(pub.createdAt).toLocaleDateString("zh-CN")}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            {pub.url && (
                              <a
                                href={pub.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm px-3 py-1 rounded hover:bg-[var(--color-muted)]"
                              >
                                链接
                              </a>
                            )}
                            <Link
                              href={`/admin/publications/${pub.id}/edit`}
                              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 bg-transparent hover:bg-[var(--color-muted)] text-[var(--color-foreground)] h-8 px-3 text-sm"
                            >
                              编辑
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(pub.id)}
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
                    onClick={() => fetchPublications(page - 1)}
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
                    onClick={() => fetchPublications(page + 1)}
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
