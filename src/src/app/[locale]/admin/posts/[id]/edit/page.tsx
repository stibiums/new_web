"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { SplitEditor, type ViewMode } from "@/components/editor/SplitEditor";
import { Monitor, Columns, FileCode, Link2, Search, X, Plus } from "lucide-react";
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

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const postId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // 元信息状态
  const [metaOpen, setMetaOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [published, setPublished] = useState(false);

  // 链接管理状态
  const [linksOpen, setLinksOpen] = useState(false);
  const [explicitLinks, setExplicitLinks] = useState<{ id: string; target: { id: string; slug: string; title: string; type: string } }[]>([]);
  const [linkLoading, setLinkLoading] = useState(false);
  // 搜索状态
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; slug: string; title: string; type: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 内容和标题状态
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  // Git 相关状态
  const [filePath, setFilePath] = useState("");
  const [gitCommit, setGitCommit] = useState<string | null>(null);
  // 保存状态
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  // 视图模式
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  // Memoized onSave 回调（避免每次渲染创建新函数导致 SplitEditor 重渲染）
  const handleEditorSave = useCallback(async (value: string) => {
    setContent(value);
    const form = document.getElementById("edit-form") as HTMLFormElement | null;
    if (form) form.requestSubmit();
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/admin/posts/${postId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch post");
        }

        const post = data.data;
        setSlug(post.slug || "");
        setTitle(post.title || "");
        setContent(post.content || "");
        setExcerpt(post.excerpt || "");
        setCategory(post.category || "");
        setTags(post.tags || "");
        setCoverImage(post.coverImage || "");
        setPublished(post.published);
        // Git 相关
        setFilePath(post.filePath || "");
        setGitCommit(post.gitCommit || null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to fetch post");
        router.push("/admin/posts");
      } finally {
        setFetching(false);
      }
    };

    fetchPost();
  }, [postId, router, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveStatus('saving');

    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          content,
          excerpt,
          category,
          tags,
          coverImage,
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
      toast.success("文章更新成功");

      // 3 秒后重置状态
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      toast.error(error instanceof Error ? error.message : "更新失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchLinks = async () => {
    try {
      const res = await fetch(`/api/admin/posts/${postId}/links`);
      const data = await res.json();
      if (res.ok) setExplicitLinks(data.data);
    } catch {}
  };

  // 使用 ref 持有 explicitLinks 的最新值，避免 handleSearch 频繁重建
  const explicitLinksRef = useRef(explicitLinks);
  explicitLinksRef.current = explicitLinks;

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/posts?search=${encodeURIComponent(q)}&limit=8`);
        const data = await res.json();
        if (res.ok) {
          const linked = new Set(explicitLinksRef.current.map((l) => l.target.id));
          setSearchResults(
            (data.data as any[]).filter((p) => p.id !== postId && !linked.has(p.id))
          );
        }
      } catch {}
      finally { setSearching(false); }
    }, 300);
  }, [postId]);

  const handleAddLink = async (target: { id: string; slug: string; title: string; type: string }) => {
    setLinkLoading(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: target.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "添加失败");
      setExplicitLinks((prev) => [...prev, data.data]);
      // 从搜索结果中移除已添加的
      setSearchResults((prev) => prev.filter((p) => p.id !== target.id));
      toast.success(`已关联「${target.title}」`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "添加失败");
    } finally {
      setLinkLoading(false);
    }
  };

  const handleRemoveLink = async (targetId: string) => {
    try {
      const res = await fetch(`/api/admin/posts/${postId}/links`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId }),
      });
      if (!res.ok) throw new Error("删除失败");
      setExplicitLinks((prev) => prev.filter((l) => l.target.id !== targetId));
      toast.success("链接已删除");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    }
  };

  const handleMetaSave = () => {
    setMetaOpen(false);
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
          onClick={() => router.push("/admin/posts")}
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
          <Button variant="ghost" size="sm" onClick={() => { setLinksOpen(true); fetchLinks(); }}>
            <Link2 className="w-4 h-4" />
            <span className="ml-1 hidden sm:inline">链接</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMetaOpen(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="ml-1 hidden sm:inline">属性</span>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => router.push("/admin/posts")}>取消</Button>
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

        {/* Split 编辑器 */}
        <div className="flex-1 min-h-0 h-full">
          <SplitEditor
            value={content}
            onChange={setContent}
            onSave={handleEditorSave}
            filePath={filePath}
            currentCommit={gitCommit}
            contentType="posts"
            slug={slug}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            hideTopBar
          />
        </div>

        {/* 隐藏的表单，用于提交保存 */}
        <form id="edit-form" onSubmit={handleSubmit} style={{ display: 'none' }} />
      </main>

      {/* 关联链接弹窗 */}
      <Dialog open={linksOpen} onOpenChange={(open) => { setLinksOpen(open); if (!open) { setSearchQuery(""); setSearchResults([]); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>关联链接</DialogTitle>
            <DialogDescription>
              搜索并关联其他文章/笔记，关联关系将显示在知识图谱中
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="搜索文章或笔记标题…"
                className="pl-9 pr-9"
                autoFocus
              />
              {searchQuery && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 搜索结果 */}
            {searchQuery && (
              <div className="rounded-md border border-border overflow-hidden">
                {searching && (
                  <div className="text-sm text-muted-foreground text-center py-4">搜索中…</div>
                )}
                {!searching && searchResults.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">无匹配结果</div>
                )}
                {!searching && searchResults.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => handleAddLink(post)}
                    disabled={linkLoading}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border last:border-0 text-left"
                  >
                    <div className="min-w-0">
                      <span className="font-medium truncate block">{post.title}</span>
                      <span className="text-xs text-muted-foreground font-mono">{post.slug}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted">{post.type}</span>
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 已关联列表 */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                已关联 ({explicitLinks.length})
              </p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {explicitLinks.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">暂无关联链接</p>
                )}
                {explicitLinks.map((link) => (
                  <div key={link.target.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm group">
                    <div className="min-w-0">
                      <span className="font-medium">{link.target.title}</span>
                      <span className="ml-2 text-muted-foreground font-mono text-xs">{link.target.slug}</span>
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-muted">{link.target.type}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveLink(link.target.id)}
                      className="shrink-0 ml-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">关闭</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 属性设置弹窗 */}
      <Dialog open={metaOpen} onOpenChange={setMetaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>属性设置</DialogTitle>
            <DialogDescription>
              设置文章的元信息
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium mb-2">Slug</label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="post-slug"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">摘要</label>
              <Input
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="输入文章摘要"
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
            <div>
              <label className="block text-sm font-medium mb-2">封面图</label>
              <Input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="封面图 URL"
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
                发布文章
              </label>
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
