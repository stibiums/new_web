"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { SplitEditor, type ViewMode } from "@/components/editor/SplitEditor";
import { Monitor, Columns, FileCode } from "lucide-react";
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

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const noteId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [metaOpen, setMetaOpen] = useState(false);

  // 基本信息
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [published, setPublished] = useState(false);

  // 内容
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");

  // Git 相关状态
  const [filePath, setFilePath] = useState("");
  const [gitCommit, setGitCommit] = useState<string | null>(null);
  // 保存状态
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  // 视图模式（受控，提升到页面层以便在工具栏显示切换按钮）
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await fetch(`/api/admin/posts/${noteId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch note");
        }

        const note = data.data;

        // Verify this is a note, not a post
        if (note.type !== "NOTE") {
          toast.error("无效的笔记");
          router.push(`/${locale}/admin/notes`);
          return;
        }

        setSlug(note.slug || "");
        setTitle(note.title || "");
        setContent(note.content || "");
        setExcerpt(note.excerpt || "");
        setCategory(note.category || "");
        setTags(note.tags || "");
        setPublished(note.published);
        // Git 相关
        setFilePath(note.filePath || "");
        setGitCommit(note.gitCommit || null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to fetch note");
        router.push("/admin/notes");
      } finally {
        setFetching(false);
      }
    };

    fetchNote();
  }, [noteId, router, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveStatus('saving');

    try {
      const res = await fetch(`/api/admin/posts/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          content,
          excerpt,
          category,
          tags,
          published,
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
      toast.success("笔记更新成功");

      // 3 秒后重置状态
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      toast.error(error instanceof Error ? error.message : "更新失败");
    } finally {
      setLoading(false);
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
      {/* 合并工具栏：返回 | 视图切换 | 存属取保 */}
      <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-sm px-4 h-12 flex items-center justify-between gap-2">
        {/* 左：返回 */}
        <button
          onClick={() => router.push("/admin/notes")}
          className="flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>

        {/* 中：视图模式切换 */}
        <div className="flex items-center bg-[var(--color-muted)] rounded-md p-0.5">
          <Button variant={viewMode === 'editor' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('editor')} title="仅编辑">
            <FileCode className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === 'split' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('split')} title="分屏">
            <Columns className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === 'preview' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('preview')} title="仅预览">
            <Monitor className="w-4 h-4" />
          </Button>
        </div>

        {/* 右：保存状态 + 属性 + 取消 + 保存 */}
        <div className="flex items-center gap-2 shrink-0">
          {saveStatus !== 'idle' && (
            <div className="flex items-center gap-1 text-sm">
              {saveStatus === 'saving' && (
                <>
                  <svg className="w-4 h-4 animate-spin text-[var(--color-muted-foreground)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-[var(--color-muted-foreground)] hidden sm:inline">保存中</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-500 hidden sm:inline">已保存</span>
                  {gitCommit && <span className="text-xs text-[var(--color-muted-foreground)] font-mono">{gitCommit.substring(0, 7)}</span>}
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-red-500 hidden sm:inline">保存失败</span>
                </>
              )}
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setMetaOpen(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="ml-1 hidden sm:inline">属性</span>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => router.push("/admin/notes")}>取消</Button>
          <Button type="submit" form="edit-form" size="sm" loading={loading}>保存</Button>
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
            contentType="notes"
            slug={slug}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            hideTopBar
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
              设置笔记的元信息
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium mb-2">Slug</label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="note-slug"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">分类</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="输入分类"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">标签</label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="标签，用逗号分隔"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-border)]"
              />
              <label htmlFor="published" className="text-sm font-medium">
                发布笔记
              </label>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button onClick={() => setMetaOpen(false)}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
