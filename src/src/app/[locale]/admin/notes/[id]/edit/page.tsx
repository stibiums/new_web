"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { SplitEditor } from "@/components/editor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const noteId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // 基本信息
  const [slug, setSlug] = useState("");
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
          window.location.href = `/${locale}/admin/notes`;
          return;
        }

        setSlug(note.slug || "");
        setTitle(note.title || "");
        setContent(note.content || "");
        setExcerpt(note.excerpt || "");
        setPublished(note.published);
        // Git 相关
        setFilePath(note.filePath || "");
        setGitCommit(note.gitCommit || null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to fetch note");
        window.location.href = `/${locale}/admin/notes`;
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
      <div className="h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-[var(--color-muted-foreground)]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--color-background)]">
      {/* 顶部工具栏 */}
      <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-sm px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => window.location.href = `/${locale}/admin/notes`}
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
          <Button type="button" variant="outline" size="sm" onClick={() => window.location.href = `/${locale}/admin/notes`}>
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
          />
        </div>

        {/* 隐藏的表单 */}
        <form id="edit-form" onSubmit={handleSubmit} style={{ display: 'none' }} />
      </main>
    </div>
  );
}
