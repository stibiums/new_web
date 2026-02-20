"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { YooptaEditorWrapper } from "@/components/editor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "sonner";

export default function NewNotePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [loading, setLoading] = useState(false);

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [content, setContent] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [excerptEn, setExcerptEn] = useState("");
  const [published, setPublished] = useState(false);

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
          titleEn,
          content,
          contentEn,
          excerpt,
          excerptEn,
          type: "NOTE",
          published,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "创建失败");
      }

      toast.success("笔记创建成功");
      router.push(`/${locale}/admin/notes`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          创建新笔记
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          创建一篇新的笔记
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Slug</label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="note-slug"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="published" className="text-sm font-medium">
                发布笔记
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>中文内容</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">标题</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入笔记标题"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">摘要</label>
              <Input
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="输入笔记摘要"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">内容</label>
              <YooptaEditorWrapper
                content={content}
                onChange={setContent}
                placeholder="开始编写笔记内容..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>English Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Enter note title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Excerpt</label>
              <Input
                value={excerptEn}
                onChange={(e) => setExcerptEn(e.target.value)}
                placeholder="Enter note excerpt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <YooptaEditorWrapper
                content={contentEn}
                onChange={setContentEn}
                placeholder="Start writing content..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            取消
          </Button>
          <Button type="submit" loading={loading}>
            创建笔记
          </Button>
        </div>
      </form>
    </div>
  );
}
