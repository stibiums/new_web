"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TiptapEditor } from "@/components/editor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "sonner";

export default function NewPostPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const router = useRouter();
  const [locale, setLocale] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [content, setContent] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [excerptEn, setExcerptEn] = useState("");

  // 动态获取 locale
  if (!locale) {
    params.then((p) => setLocale(p.locale));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          titleEn,
          content,
          contentEn,
          excerpt,
          excerptEn,
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          创建新文章
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          创建一篇新的博客文章
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="输入文章标题"
                required
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
              <label className="block text-sm font-medium mb-2">内容</label>
              <TiptapEditor
                content={content}
                onChange={setContent}
                placeholder="开始编写文章内容..."
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
                placeholder="Enter post title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Excerpt</label>
              <Input
                value={excerptEn}
                onChange={(e) => setExcerptEn(e.target.value)}
                placeholder="Enter post excerpt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <TiptapEditor
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
            创建文章
          </Button>
        </div>
      </form>
    </div>
  );
}
