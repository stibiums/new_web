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

interface Project {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  techStack: string | null;
  demoUrl: string | null;
  githubUrl: string | null;
  coverImage: string | null;
  published: boolean;
  sortOrder: number;
  createdAt: string;
}

export default function ProjectsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [limit] = useState(10);

  const fetchProjects = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
      });
      if (search) params.append("search", search);

      const res = await fetch(`/api/admin/projects?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch projects");
      }

      setProjects(data.data);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast.success("Project deleted successfully");
      fetchProjects(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">项目管理</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            管理您的项目作品集
          </p>
        </div>
        <Link 
          href="/admin/projects/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] h-10 px-4 text-base"
        >
          新建项目
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>项目列表</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-4 flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索项目..."
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
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-muted-foreground)]">
              暂无项目
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left py-3 px-4 font-medium">标题</th>
                      <th className="text-left py-3 px-4 font-medium">技术栈</th>
                      <th className="text-left py-3 px-4 font-medium">状态</th>
                      <th className="text-left py-3 px-4 font-medium">排序</th>
                      <th className="text-left py-3 px-4 font-medium">创建时间</th>
                      <th className="text-right py-3 px-4 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr
                        key={project.id}
                        className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)] cursor-pointer"
                        onClick={() => router.push(`/admin/projects/${project.id}/edit`)}
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium">{project.title}</div>
                          {project.titleEn && (
                            <div className="text-sm text-[var(--color-muted-foreground)]">
                              {project.titleEn}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-[var(--color-muted-foreground)]">
                          {project.techStack || "-"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={project.published ? "success" : "outline"}>
                            {project.published ? "已发布" : "草稿"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{project.sortOrder}</td>
                        <td className="py-3 px-4 text-sm text-[var(--color-muted-foreground)]">
                          {new Date(project.createdAt).toLocaleDateString("zh-CN")}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            {project.demoUrl && (
                              <a
                                href={project.demoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm px-3 py-1 rounded hover:bg-[var(--color-muted)]"
                              >
                                Demo
                              </a>
                            )}
                            {project.githubUrl && (
                              <a
                                href={project.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm px-3 py-1 rounded hover:bg-[var(--color-muted)]"
                              >
                                GitHub
                              </a>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
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
                    onClick={() => fetchProjects(page - 1)}
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
                    onClick={() => fetchProjects(page + 1)}
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
