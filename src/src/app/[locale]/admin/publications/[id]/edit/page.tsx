"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "sonner";

export default function EditPublicationPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const publicationId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [venue, setVenue] = useState("");
  const [year, setYear] = useState("");
  const [doi, setDoi] = useState("");
  const [url, setUrl] = useState("");
  const [bibtex, setBibtex] = useState("");
  const [abstract, setAbstract] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    const fetchPublication = async () => {
      try {
        const res = await fetch(`/api/admin/publications/${publicationId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch publication");
        }

        const pub = data.data;

        setTitle(pub.title);
        setAuthors(pub.authors);
        setVenue(pub.venue || "");
        setYear(pub.year?.toString() || "");
        setDoi(pub.doi || "");
        setUrl(pub.url || "");
        setBibtex(pub.bibtex || "");
        setAbstract(pub.abstract || "");
        setSortOrder(pub.sortOrder);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch publication"
        );
        router.push("/admin/publications");
      } finally {
        setFetching(false);
      }
    };

    fetchPublication();
  }, [publicationId, router, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/publications/${publicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          authors,
          venue,
          year,
          doi,
          url,
          bibtex,
          abstract,
          sortOrder: Number(sortOrder),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "更新失败");
      }

      toast.success("出版物更新成功");
      router.push("/admin/publications");
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
          编辑出版物
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          修改出版物信息
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                标题 <span className="text-red-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入出版物标题"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                作者 <span className="text-red-500">*</span>
              </label>
              <Input
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                placeholder="作者1, 作者2, ..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  期刊/会议
                </label>
                <Input
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="发表场所"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">年份</label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2024"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">排序</label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>链接与引用</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">DOI</label>
              <Input
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                placeholder="10.1000/xyz123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">URL</label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                BibTeX 引用
              </label>
              <Textarea
                value={bibtex}
                onChange={(e) => setBibtex(e.target.value)}
                placeholder="@article{...}"
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>摘要</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="输入出版物摘要..."
              rows={6}
            />
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
