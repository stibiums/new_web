"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { SplitEditor } from "@/components/editor/SplitEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/Dialog";
import { toast } from "sonner";

export default function NewProjectPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [loading, setLoading] = useState(false);

  // 元信息状态
  const [metaOpen, setMetaOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [techStack, setTechStack] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [published, setPublished] = useState(false);

  // 内容和标题状态
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 如果 slug 为空，从标题生成
    const finalSlug = slug || generateSlug(title);

    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: finalSlug,
          title,
          description,
          content,
          techStack,
          githubUrl,
          demoUrl,
          coverImage,
          sortOrder: Number(sortOrder),
          published,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "创建失败");
      }

      toast.success("项目创建成功");
      router.push("/admin/projects");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建失败");
    } finally {
      setLoading(false);
    }
  };

  const handleMetaSave = () => {
    setMetaOpen(false);
  };

  // 从标题生成 slug
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      || `project-${Date.now()}`;
  };

  const handleSave = useCallback((value: string) => {
    setContent(value);
    const form = document.getElementById("edit-form") as HTMLFormElement | null;
    if (form) form.requestSubmit();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[var(--color-background)]">
      {/* 顶部工具栏 */}
      <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-sm px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setMetaOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            属性
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
            取消
          </Button>
          <Button type="submit" form="edit-form" size="sm" loading={loading}>
            创建
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* 标题输入 */}
        <div className="shrink-0 px-6 py-4 border-b border-[var(--color-border)]">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="无标题"
            className="w-full text-2xl font-bold bg-transparent border-none outline-none text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/50"
            required
          />
        </div>

        {/* Split 编辑器 */}
        <div className="flex-1 min-h-0 h-full">
          <SplitEditor
            value={content}
            onChange={setContent}
            onSave={handleSave}
            contentType="projects"
            slug={slug}
          />
        </div>

        {/* 隐藏的表单 */}
        <form id="edit-form" onSubmit={handleSubmit} style={{ display: 'none' }} />
      </main>

      {/* 属性设置弹窗 */}
      <Dialog open={metaOpen} onOpenChange={setMetaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>属性设置</DialogTitle>
            <DialogDescription>
              设置项目的元信息
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium mb-2">Slug</label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="project-slug"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">技术栈</label>
              <Input
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="React, Node.js, PostgreSQL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">GitHub 链接</label>
              <Input
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username/project"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Demo 链接</label>
              <Input
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://demo.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">封面图</label>
              <Input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="封面图 URL"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">排序</label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="published"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--color-border)]"
                />
                <label htmlFor="published" className="text-sm font-medium">
                  发布项目
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button onClick={handleMetaSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
