"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Monitor, Columns, FileCode, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MonacoMarkdownEditor } from "./MonacoMarkdownEditor";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";
import { GitHistoryDialog } from "./GitHistoryDialog";

export interface SplitEditorProps {
  /** 文件内容 */
  value: string;
  /** 内容变化回调 */
  onChange?: (value: string) => void;
  /** 保存回调 (Ctrl+S 触发) */
  onSave?: (value: string) => void;
  /** 是否只读 */
  readOnly?: boolean;
  /** 加载状态显示 */
  loading?: React.ReactNode;
  /** 自定义 className */
  className?: string;
  /** 最小高度 */
  minHeight?: string | number;
  /** 文件路径 (用于 Git 历史) */
  filePath?: string;
  /** 当前 Git commit */
  currentCommit?: string | null;
}

type ViewMode = "split" | "editor" | "preview";

/**
 * SplitEditor - Overleaf 风格分屏编辑器
 *
 * 功能:
 * - 左右分屏布局：左侧编辑器，右侧 Markdown 预览
 * - 支持分屏/编辑/预览三种模式切换
 * - 左侧工具栏：资源文件管理
 * - 右侧工具栏：历史版本管理
 * - 可拖拽调整分屏比例
 */
export function SplitEditor({
  value,
  onChange,
  onSave,
  readOnly = false,
  loading,
  className = "",
  minHeight = "100%",
  filePath,
  currentCommit,
}: SplitEditorProps) {
  // 视图模式
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  // 分屏比例
  const [splitRatio, setSplitRatio] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // 资源面板状态
  const [showResourcePanel, setShowResourcePanel] = useState(false);

  // 历史版本弹窗状态
  const [showHistory, setShowHistory] = useState(false);

  // 拖拽处理
  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.max(20, Math.min(80, newRatio)));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // 处理资源插入
  const handleInsertResource = useCallback((markdown: string) => {
    // 通过自定义事件通知编辑器插入内容
    const event = new CustomEvent("insert-resource", { detail: markdown });
    window.dispatchEvent(event);
    setShowResourcePanel(false);
  }, []);

  // 恢复历史版本
  const handleRevert = useCallback(
    (content: string) => {
      onChange?.(content);
      // 同时触发保存
      setTimeout(() => {
        onSave?.(content);
      }, 100);
    },
    [onChange, onSave]
  );

  return (
    <div className={`split-editor h-full ${className}`}>
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-muted)]/30">
        <div className="flex items-center gap-1">
          {/* 视图模式切换 */}
          <div className="flex items-center bg-[var(--color-muted)] rounded-md p-0.5">
            <Button
              variant={viewMode === "editor" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("editor")}
              title="仅编辑"
            >
              <FileCode className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "split" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("split")}
              title="分屏模式"
            >
              <Columns className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "preview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("preview")}
              title="仅预览"
            >
              <Monitor className="w-4 h-4" />
            </Button>
          </div>

          {/* 资源管理按钮 - 左侧面板 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowResourcePanel(true)}
            disabled={readOnly}
            title="资源管理"
          >
            <FileCode className="w-4 h-4" />
            <span className="ml-1 hidden sm:inline">资源</span>
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {/* 历史版本按钮 - 右侧面板 */}
          {filePath && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(true)}
              disabled={readOnly}
              title="历史版本"
            >
              <History className="w-4 h-4" />
              <span className="ml-1 hidden sm:inline">历史</span>
            </Button>
          )}

          {/* 当前 Commit 显示 */}
          {currentCommit && (
            <div className="text-xs text-muted-foreground">
              <code className="bg-muted px-1.5 py-0.5 rounded">
                {currentCommit.substring(0, 7)}
              </code>
            </div>
          )}
        </div>
      </div>

      {/* 编辑区域 */}
      <div ref={containerRef} className="h-full">
        {viewMode === "split" ? (
          <div className="flex h-full">
            {/* 左侧：编辑器 */}
            <div style={{ width: `${splitRatio}%` }} className="h-full border-r border-[var(--color-border)] overflow-hidden">
              <div className="h-full">
              <MonacoMarkdownEditor
                value={value}
                onChange={onChange}
                onSave={onSave}
                readOnly={readOnly}
                loading={loading}
                minHeight={minHeight}
                filePath={filePath}
                currentCommit={currentCommit}
                hideToolbar
              />
              </div>
            </div>

            {/* 分隔条 */}
            <div
              className="w-1 bg-[var(--color-border)] hover:bg-primary transition-colors cursor-col-resize flex-shrink-0"
              onMouseDown={handleMouseDown}
            />

            {/* 右侧：预览 */}
            <div style={{ width: `${100 - splitRatio}%` }} className="h-full overflow-auto bg-[var(--color-background)]">
              <div className="p-4">
                <MarkdownRenderer content={value} />
              </div>
            </div>
          </div>
        ) : viewMode === "editor" ? (
          <div className="h-full">
            <MonacoMarkdownEditor
              value={value}
              onChange={onChange}
              onSave={onSave}
              readOnly={readOnly}
              loading={loading}
              minHeight={minHeight}
              filePath={filePath}
              currentCommit={currentCommit}
              hideToolbar
            />
          </div>
        ) : (
          <div className="h-full overflow-auto bg-[var(--color-background)]">
            <div className="p-4">
              <MarkdownRenderer content={value} />
            </div>
          </div>
        )}
      </div>

      {/* 资源管理面板 */}
      {showResourcePanel && (
        <ResourcePanel
          onClose={() => setShowResourcePanel(false)}
          onInsert={handleInsertResource}
        />
      )}

      {/* 历史版本弹窗 */}
      {filePath && (
        <GitHistoryDialog
          open={showHistory}
          onOpenChange={setShowHistory}
          filePath={filePath}
          currentContent={value}
          onRevert={handleRevert}
        />
      )}
    </div>
  );
}

// 资源面板组件
interface ResourcePanelProps {
  onClose: () => void;
  onInsert: (markdown: string) => void;
}

function ResourcePanel({ onClose, onInsert }: ResourcePanelProps) {
  const [resources, setResources] = useState<{ url: string; name: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 加载资源列表
  // TODO: 实现资源列表加载 API
  // useEffect(() => { ... }, [])

  const handleInsert = (resource: { url: string; name: string; type: string }) => {
    let markdown = "";
    if (resource.type.startsWith("image/")) {
      markdown = `![${resource.name}](${resource.url})\n`;
    } else if (resource.type === "application/pdf") {
      markdown = `[${resource.name}](${resource.url})\n`;
    } else {
      markdown = `[${resource.name}](${resource.url})\n`;
    }
    onInsert(markdown);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-[var(--color-background)] border-l border-[var(--color-border)] shadow-lg z-50 flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="font-semibold">资源管理</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>

      {/* 搜索 */}
      <div className="px-4 py-2 border-b border-[var(--color-border)]">
        <input
          type="text"
          placeholder="搜索资源..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-[var(--color-muted)] border border-[var(--color-border)] rounded-md"
        />
      </div>

      {/* 资源列表 */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>暂无资源</p>
            <p className="text-xs mt-1">使用上方按钮上传文件</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {resources
              .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
              .map((resource, index) => (
                <button
                  key={index}
                  className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors text-left"
                  onClick={() => handleInsert(resource)}
                >
                  {resource.type.startsWith("image/") ? (
                    <img
                      src={resource.url}
                      alt={resource.name}
                      className="w-full h-20 object-cover rounded mb-2"
                    />
                  ) : (
                    <div className="w-full h-20 flex items-center justify-center bg-[var(--color-muted)] rounded mb-2">
                      <FileCode className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <p className="text-xs truncate">{resource.name}</p>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SplitEditor;
