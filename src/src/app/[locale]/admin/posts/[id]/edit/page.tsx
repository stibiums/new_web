"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { TiptapEditor } from "@/components/editor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "sonner";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const postId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [content, setContent] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [excerptEn, setExcerptEn] = useState("");
  const [published, setPublished] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/admin/posts/${postId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch post");
        }

        const post = data.data;
        setSlug(post.slug);
        setTitle(post.title);
        setTitleEn(post.titleEn || "");
        setContent(post.content || "");
        setContentEn(post.contentEn || "");
        setExcerpt(post.excerpt || "");
        setExcerptEn(post.excerptEn || "");
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
          titleEn,
          content,
          contentEn,
          excerpt,
          excerptEn,
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

  if (fetching) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8 text-[var(--color-muted-foreground)]">
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          编辑文章
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          修改文章内容
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
                placeholder="post-slug"
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
                发布文章
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
            保存更改
          </Button>
        </div>
      </form>
    </div>
  );
}
