"use client";

import { useState, useEffect, useRef } from "react";
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

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const projectId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [htmlUploading, setHtmlUploading] = useState(false);

  // 元信息弹窗
  const [metaOpen, setMetaOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [techStack, setTechStack] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [published, setPublished] = useState(false);
  const [linkType, setLinkType] = useState<"DETAIL" | "GITHUB" | "DEMO" | "EXTERNAL">("DETAIL");
  const [detailType, setDetailType] = useState<"MARKDOWN" | "HTML" | "EXTERNAL">("MARKDOWN");
  const [externalUrl, setExternalUrl] = useState("");
  const [htmlFilePath, setHtmlFilePath] = useState("");

  // 内容
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");

  // Git 相关状态
  const [filePath, setFilePath] = useState("");
  const [gitCommit, setGitCommit] = useState<string | null>(null);
  // 保存状态
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/admin/projects/${projectId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch project");
        }

        const project = data.data;

        setSlug(project.slug || "");
        setTitle(project.title || "");
        setDescription(project.description || "");
        setContent(project.content || "");
        setTechStack(project.techStack || "");
        setGithubUrl(project.githubUrl || "");
        setDemoUrl(project.demoUrl || "");
        setCoverImage(project.coverImage || "");
        setSortOrder(project.sortOrder || 0);
        setPublished(project.published);
        setLinkType(project.linkType || "DETAIL");
        setDetailType(project.detailType || "MARKDOWN");
        setExternalUrl(project.externalUrl || "");
        setHtmlFilePath(project.htmlFilePath || "");
        // Git 相关
        setFilePath(project.filePath || "");
        setGitCommit(project.gitCommit || null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to fetch project");
        router.push("/admin/projects");
      } finally {
        setFetching(false);
      }
    };

    fetchProject();
  }, [projectId, router, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveStatus('saving');

    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          description,
          content,
          techStack,
          githubUrl,
          demoUrl,
          coverImage,
          sortOrder: Number(sortOrder),
          published,
          linkType,
          detailType,
          externalUrl,
          htmlFilePath,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "更新失败");
      }

      // 更新 Git commit 状态
      if (data.data?.gitCommit) {
        setGitCommit(data.data.gitCommit);
      }

      setSaveStatus('saved');
      toast.success("项目更新成功");

      // 3 秒后重置状态
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      toast.error(error instanceof Error ? error.message : "更新失败");
    } finally {
      setLoading(false);
    }
  };

  const handleMetaSave = () => {
    setMetaOpen(false);
  };

  const htmlFileInputRef = useRef<HTMLInputElement>(null);

  const handleHtmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHtmlUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "html");
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");
      setHtmlFilePath(data.url);
      toast.success("HTML 文件上传成功");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上传失败");
    } finally {
      setHtmlUploading(false);
      if (htmlFileInputRef.current) htmlFileInputRef.current.value = "";
    }
  };

  if (fetching) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-[var(--color-muted-foreground)]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--color-background)]">
      {/* 顶部工具栏 */}
      <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-sm px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => router.push("/admin/projects")}
          className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <div className="flex items-center gap-3">
          {/* 保存状态显示 */}
          {saveStatus !== 'idle' && (
            <div className="flex items-center gap-1.5 text-sm">
              {saveStatus === 'saving' && (
                <>
                  <svg className="w-4 h-4 animate-spin text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-[var(--color-muted-foreground)]">保存中...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-500">已保存</span>
                  {gitCommit && (
                    <span className="text-xs text-[var(--color-muted-foreground)] font-mono">
                      {gitCommit.substring(0, 7)}
                    </span>
                  )}
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-red-500">保存失败</span>
                </>
              )}
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setMetaOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            属性
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => router.push("/admin/projects")}>
            取消
          </Button>
          <Button type="submit" form="edit-form" size="sm" loading={loading}>
            保存
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

        {/* 编辑器 */}
        <div className="flex-1 min-h-0 h-full">
          <SplitEditor
            value={content}
            onChange={setContent}
            onSave={async (value) => {
              setContent(value);
              const form = document.getElementById("edit-form") as HTMLFormElement | null;
              if (form) form.requestSubmit();
            }}
            filePath={filePath}
            currentCommit={gitCommit}
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
              <label className="block text-sm font-medium mb-2">卡片点击行为</label>
              <select
                value={linkType}
                onChange={(e) => setLinkType(e.target.value as typeof linkType)}
                className="w-full px-3 py-2 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]"
              >
                <option value="DETAIL">跳转详情页</option>
                <option value="GITHUB">跳转 GitHub</option>
                <option value="DEMO">跳转 Demo</option>
                <option value="EXTERNAL">跳转外部链接</option>
              </select>
            </div>
            {linkType === "EXTERNAL" && (
              <div>
                <label className="block text-sm font-medium mb-2">外部链接</label>
                <Input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            )}
            {linkType === "DETAIL" && (
              <div>
                <label className="block text-sm font-medium mb-2">详情页内容类型</label>
                <select
                  value={detailType}
                  onChange={(e) => setDetailType(e.target.value as typeof detailType)}
                  className="w-full px-3 py-2 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]"
                >
                  <option value="MARKDOWN">Markdown 内容</option>
                  <option value="HTML">HTML 文件</option>
                  <option value="EXTERNAL">外部链接</option>
                </select>
              </div>
            )}
            {linkType === "DETAIL" && detailType === "HTML" && (
              <div>
                <label className="block text-sm font-medium mb-2">HTML 文件路径</label>
                <div className="flex gap-2">
                  <Input
                    value={htmlFilePath}
                    onChange={(e) => setHtmlFilePath(e.target.value)}
                    placeholder="/assets/html/project.html"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={htmlUploading}
                    onClick={() => htmlFileInputRef.current?.click()}
                  >
                    上传
                  </Button>
                  <input
                    ref={htmlFileInputRef}
                    type="file"
                    accept=".html,.htm"
                    className="hidden"
                    onChange={handleHtmlUpload}
                  />
                </div>
              </div>
            )}
            {linkType === "DETAIL" && detailType === "EXTERNAL" && (
              <div>
                <label className="block text-sm font-medium mb-2">外部链接</label>
                <Input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            )}
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
