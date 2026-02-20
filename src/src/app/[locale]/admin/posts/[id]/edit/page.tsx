"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { TiptapEditor } from "@/components/editor";
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

  // 内容和标题状态
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

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
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to fetch post");
        router.push(`/${locale}/admin/posts`);
      } finally {
        setFetching(false);
      }
    };

    fetchPost();
  }, [postId, router, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "更新失败");
      }

      toast.success("文章更新成功");
      router.push(`/${locale}/admin/posts`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新失败");
    } finally {
      setLoading(false);
    }
  };

  const handleMetaSave = () => {
    setMetaOpen(false);
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="text-[var(--color-muted-foreground)]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            返回
          </button>
          <Button variant="ghost" size="sm" onClick={() => setMetaOpen(true)}>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            属性
          </Button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 标题输入 */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="无标题"
              className="w-full text-4xl font-bold bg-transparent border-none outline-none text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/50"
              required
            />
          </div>

          {/* Tiptap 编辑器 */}
          <div className="min-h-[400px]">
            <TiptapEditor
              content={content}
              onChange={setContent}
              placeholder="开始编写..."
            />
          </div>

          {/* 底部操作栏 */}
          <div className="flex justify-end gap-3 pt-6 border-t border-[var(--color-border)]">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              取消
            </Button>
            <Button type="submit" loading={loading}>
              保存
            </Button>
          </div>
        </form>
      </main>

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
