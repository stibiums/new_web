"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author: string;
}

interface GitHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string;
  currentContent: string;
  onRevert: (content: string) => void;
}

export function GitHistoryDialog({
  open,
  onOpenChange,
  filePath,
  currentContent,
  onRevert,
}: GitHistoryDialogProps) {
  const [history, setHistory] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [reverting, setReverting] = useState(false);

  // 加载历史记录
  useEffect(() => {
    if (open && filePath) {
      loadHistory();
    }
  }, [open, filePath]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/git/history?filePath=${encodeURIComponent(filePath)}&limit=20`
      );
      const data = await res.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  // 预览历史版本
  const handlePreview = async (commitHash: string) => {
    setSelectedCommit(commitHash);
    setPreviewLoading(true);
    try {
      const res = await fetch(
        `/api/admin/git/history?filePath=${encodeURIComponent(filePath)}&commitHash=${commitHash}`
      );
      const data = await res.json();
      if (data.content !== undefined) {
        setPreviewContent(data.content);
      }
    } catch (error) {
      console.error("Failed to preview:", error);
    } finally {
      setPreviewLoading(false);
    }
  };

  // 恢复到历史版本
  const handleRevert = async () => {
    if (!selectedCommit) return;

    if (!confirm("确定要恢复到选中的版本吗？当前内容将被覆盖。")) {
      return;
    }

    setReverting(true);
    try {
      const res = await fetch("/api/admin/git/revert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath,
          commitHash: selectedCommit,
        }),
      });
      const data = await res.json();

      if (data.success) {
        // 如果有预览内容，更新编辑器
        if (previewContent) {
          onRevert(previewContent);
        }
        onOpenChange(false);
        alert(`已恢复到版本 ${selectedCommit.substring(0, 7)}`);
      } else {
        alert("恢复失败: " + data.error);
      }
    } catch (error) {
      console.error("Failed to revert:", error);
      alert("恢复失败");
    } finally {
      setReverting(false);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>历史版本</DialogTitle>
          <DialogDescription>
            文件: {filePath}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* 历史列表 */}
          <div className="w-1/2 overflow-auto">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                加载中...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无历史记录
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((commit) => (
                  <div
                    key={commit.hash}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCommit === commit.hash
                        ? "bg-primary/10 border border-primary"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    onClick={() => handlePreview(commit.hash)}
                  >
                    <div className="flex items-center justify-between">
                      <code className="text-xs text-primary">
                        {commit.hash.substring(0, 7)}
                      </code>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(commit.date)}
                      </span>
                    </div>
                    <p className="text-sm mt-1 line-clamp-2">
                      {commit.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 预览 */}
          <div className="w-1/2 flex flex-col min-h-0">
            <div className="text-sm font-medium mb-2">
              预览 {selectedCommit ? `#${selectedCommit.substring(0, 7)}` : ""}
            </div>
            <div className="flex-1 overflow-auto bg-muted rounded-lg p-3">
              {previewLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  加载中...
                </div>
              ) : previewContent ? (
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {previewContent}
                </pre>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  点击左侧历史记录查看预览
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleRevert}
            disabled={!selectedCommit || reverting}
          >
            {reverting ? "恢复中..." : "恢复到选中版本"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
