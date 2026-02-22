"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { SplitEditor } from "@/components/editor";
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

export default function NewPostPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
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
        throw new Error(error.error || "创建失败");
      }

      toast.success("文章创建成功");
      router.push(`/${locale}/admin/posts`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建失败");
    } finally {
      setLoading(false);
    }
  };

  const handleMetaSave = () => {
    setMetaOpen(false);
  };

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
            onSave={async (value) => {
              setContent(value);
              const form = document.getElementById("edit-form") as HTMLFormElement | null;
              if (form) form.requestSubmit();
            }}
          />
        </div>

        {/* 隐藏的表单，用于提交保存 */}
        <form id="edit-form" onSubmit={handleSubmit} style={{ display: 'none' }} />
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
