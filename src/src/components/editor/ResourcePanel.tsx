"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Upload,
  Loader2,
  Image as ImageIcon,
  FileText,
  Video,
  FileCode,
  Download,
  Trash2,
  Search,
  FolderOpen,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

// 内容类型
export type ContentType = "posts" | "notes" | "projects";

// 资源项接口
interface ResourceItem {
  name: string;
  url: string;
  type: string; // image | video | pdf | jupyter | other
  size: string;
  sizeBytes: number;
  createdAt: string;
}

// 组件 Props
export interface ResourcePanelProps {
  contentType: ContentType;
  slug: string;
  onInsert: (markdown: string) => void;
  onClose: () => void;
}

// 筛选类型
type FilterType = "" | "image" | "video" | "pdf" | "jupyter";

// 根据资源类型获取图标
function ResourceIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case "image":
      return <ImageIcon className={className} />;
    case "video":
      return <Video className={className} />;
    case "pdf":
      return <FileText className={className} />;
    case "jupyter":
      return <FileCode className={className} />;
    default:
      return <FileText className={className} />;
  }
}

// 根据资源类型生成 Markdown 语法
function generateMarkdown(resource: ResourceItem): string {
  switch (resource.type) {
    case "image":
      return `![${resource.name}](${resource.url})\n`;
    case "video":
      return `<video src="${resource.url}" controls></video>\n`;
    default:
      return `[${resource.name}](${resource.url})\n`;
  }
}

export function ResourcePanel({
  contentType,
  slug,
  onInsert,
  onClose,
}: ResourcePanelProps) {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const noSlug = !slug;

  // 加载资源列表
  const fetchResources = useCallback(async () => {
    if (noSlug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        contentType,
        slug,
      });
      if (filterType) params.set("filterType", filterType);

      const res = await fetch(`/api/admin/resources?${params}`);
      const data = await res.json();

      if (res.ok) {
        setResources(data.data || []);
      } else {
        console.error("Failed to fetch resources:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    } finally {
      setLoading(false);
    }
  }, [contentType, slug, filterType, noSlug]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // 上传文件
  const handleUpload = async (files: FileList | File[]) => {
    if (noSlug || uploading) return;

    setUploading(true);
    const fileArray = Array.from(files);
    let uploaded = 0;

    try {
      for (const file of fileArray) {
        setUploadProgress(`上传中 (${uploaded + 1}/${fileArray.length}): ${file.name}`);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("contentType", contentType);
        formData.append("slug", slug);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          console.error(`Upload failed for ${file.name}:`, data.error);
        }

        uploaded++;
      }

      // 刷新资源列表
      await fetchResources();
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  // 删除资源
  const handleDelete = async (resource: ResourceItem) => {
    if (deleting) return;

    const confirmed = window.confirm(`确定要删除 "${resource.name}" 吗？此操作不可撤销。`);
    if (!confirmed) return;

    setDeleting(resource.name);
    try {
      const params = new URLSearchParams({ contentType, slug });
      const res = await fetch(
        `/api/admin/resources/${encodeURIComponent(resource.name)}?${params}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        // 从列表中移除
        setResources((prev) => prev.filter((r) => r.name !== resource.name));
      } else {
        const data = await res.json();
        console.error("Delete failed:", data.error);
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeleting(null);
    }
  };

  // 点击插入
  const handleInsert = (resource: ResourceItem) => {
    onInsert(generateMarkdown(resource));
  };

  // 拖拽开始（从面板拖到编辑器）
  const handleDragStart = (e: React.DragEvent, resource: ResourceItem) => {
    const markdown = generateMarkdown(resource);
    e.dataTransfer.setData("text/plain", markdown);
    e.dataTransfer.setData("application/x-resource-markdown", markdown);
    e.dataTransfer.effectAllowed = "copy";
  };

  // 拖拽上传到面板
  const handleDropOnPanel = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (noSlug) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files);
    }
  };

  const handleDragOverPanel = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!noSlug) {
      setDragOver(true);
    }
  };

  const handleDragLeavePanel = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  // 文件选择器
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
    // 清除 value 以便重复选择同一文件
    e.target.value = "";
  };

  // 搜索过滤（本地）
  const filteredResources = resources.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  // 筛选标签
  const filterTabs: { label: string; value: FilterType }[] = [
    { label: "全部", value: "" },
    { label: "图片", value: "image" },
    { label: "PDF", value: "pdf" },
    { label: "视频", value: "video" },
    { label: "Notebook", value: "jupyter" },
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-[var(--color-background)] border-l border-[var(--color-border)] shadow-lg z-50 flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="font-semibold text-sm">资源管理</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[var(--color-muted)] rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 未设置 slug 的提示 */}
      {noSlug ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-[var(--color-muted-foreground)]">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium mb-1">请先设置 Slug</p>
            <p className="text-xs">
              需要在「属性」设置中配置 Slug 后才能管理资源文件。
              <br />
              Slug 用于确定资源的存储目录。
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 上传区域 */}
          <div
            className={`px-4 py-3 border-b border-[var(--color-border)] transition-colors ${
              dragOver ? "bg-primary/10 border-primary" : ""
            }`}
            onDragOver={handleDragOverPanel}
            onDragLeave={handleDragLeavePanel}
            onDrop={handleDropOnPanel}
          >
            {uploading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="truncate">{uploadProgress || "上传中..."}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  上传文件
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.ipynb,.json"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            )}
            {dragOver && (
              <p className="text-xs text-primary mt-1 text-center">
                松开以上传文件
              </p>
            )}
          </div>

          {/* 搜索和筛选 */}
          <div className="px-4 py-2 space-y-2 border-b border-[var(--color-border)]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
              <input
                type="text"
                placeholder="搜索资源..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-[var(--color-muted)] border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {filterTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilterType(tab.value)}
                  className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                    filterType === tab.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/80"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 资源列表 */}
          <div className="flex-1 overflow-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--color-muted-foreground)]" />
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="text-center py-8 text-[var(--color-muted-foreground)]">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {resources.length === 0 ? "暂无资源" : "未找到匹配资源"}
                </p>
                <p className="text-xs mt-1">
                  {resources.length === 0
                    ? "点击上方按钮或拖拽文件到此处上传"
                    : "尝试其他搜索关键词"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredResources.map((resource) => (
                  <div
                    key={resource.name}
                    draggable
                    onDragStart={(e) => handleDragStart(e, resource)}
                    className="group flex items-start gap-2 p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)]/50 transition-colors cursor-grab active:cursor-grabbing"
                  >
                    {/* 拖拽手柄 */}
                    <div className="mt-0.5 opacity-0 group-hover:opacity-50 transition-opacity">
                      <GripVertical className="w-3 h-3" />
                    </div>

                    {/* 缩略图/图标 */}
                    <div className="shrink-0 w-12 h-12 rounded overflow-hidden bg-[var(--color-muted)] flex items-center justify-center">
                      {resource.type === "image" ? (
                        <img
                          src={resource.url}
                          alt={resource.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <ResourceIcon
                          type={resource.type}
                          className="w-5 h-5 text-[var(--color-muted-foreground)]"
                        />
                      )}
                    </div>

                    {/* 文件信息 */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-medium truncate cursor-pointer hover:text-primary transition-colors"
                        title={`点击插入: ${resource.name}`}
                        onClick={() => handleInsert(resource)}
                      >
                        {resource.name}
                      </p>
                      <p className="text-[10px] text-[var(--color-muted-foreground)]">
                        {resource.size}
                      </p>
                    </div>

                    {/* 操作按钮 */}
                    <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* 插入 */}
                      <button
                        onClick={() => handleInsert(resource)}
                        title="插入到编辑器"
                        className="p-1 hover:bg-[var(--color-muted)] rounded transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                      </button>

                      {/* 下载 */}
                      <a
                        href={resource.url}
                        download={resource.name}
                        title="下载"
                        className="p-1 hover:bg-[var(--color-muted)] rounded transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-3 h-3" />
                      </a>

                      {/* 删除 */}
                      <button
                        onClick={() => handleDelete(resource)}
                        disabled={deleting === resource.name}
                        title="删除"
                        className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors"
                      >
                        {deleting === resource.name ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部状态栏 */}
          <div className="px-4 py-2 border-t border-[var(--color-border)] text-[10px] text-[var(--color-muted-foreground)]">
            {filteredResources.length} 个资源 · {contentType}/{slug}
          </div>
        </>
      )}
    </div>
  );
}

export default ResourcePanel;
