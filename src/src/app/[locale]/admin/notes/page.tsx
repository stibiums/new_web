"use client";

import { useState, useEffect } from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Note {
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

export default function NotesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [limit] = useState(10);

  const fetchNotes = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
        type: "NOTE",
      });
      if (search) params.append("search", search);

      const res = await fetch(`/api/admin/posts?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch notes");
      }

      setNotes(data.data);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotes(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast.success("Note deleted successfully");
      fetchNotes(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">笔记管理</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            管理您的笔记内容
          </p>
        </div>
        <Link 
          href="/admin/notes/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] h-10 px-4 text-base"
        >
          新建笔记
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>笔记列表</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-4 flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索笔记..."
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
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">
              暂无笔记
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left py-3 px-4 font-medium">标题</th>
                      <th className="text-left py-3 px-4 font-medium">状态</th>
                      <th className="text-left py-3 px-4 font-medium">浏览量</th>
                      <th className="text-left py-3 px-4 font-medium">创建时间</th>
                      <th className="text-right py-3 px-4 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notes.map((note) => (
                      <tr
                        key={note.id}
                        className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)] cursor-pointer"
                        onClick={() => router.push(`/admin/notes/${note.id}/edit`)}
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium">{note.title}</div>
                          {note.titleEn && (
                            <div className="text-sm text-[var(--color-muted-foreground)]">
                              {note.titleEn}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={note.published ? "success" : "outline"}>
                            {note.published ? "已发布" : "草稿"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{note.views}</td>
                        <td className="py-3 px-4 text-sm text-[var(--color-muted-foreground)]">
                          {new Date(note.createdAt).toLocaleDateString("zh-CN")}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                              className="p-1.5 rounded text-[var(--color-muted-foreground)] hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
                    onClick={() => fetchNotes(page - 1)}
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
                    onClick={() => fetchNotes(page + 1)}
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
