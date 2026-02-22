"use client";

import { useState, useEffect, useMemo } from "react";
import { diffLines } from "diff";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { MarkdownViewer } from "@/components/content/MarkdownViewer";

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

type PreviewTab = "rendered" | "diff" | "raw";

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
  const [previewTab, setPreviewTab] = useState<PreviewTab>("rendered");
  const [reverting, setReverting] = useState(false);

  // 计算 diff（历史版本 → 当前内容）
  const diffResult = useMemo(() => {
    if (!previewContent) return null;
    return diffLines(previewContent, currentContent, { newlineIsToken: false });
  }, [previewContent, currentContent]);

  // 打开时加载历史记录
  useEffect(() => {
    if (open && filePath) {
      setSelectedCommit(null);
      setPreviewContent(null);
      loadHistory();
    }
  }, [open, filePath]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/git/history?filePath=${encodeURIComponent(filePath)}&limit=30`
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

  // 预览历史版本内容
  const handleSelectCommit = async (commitHash: string) => {
    if (selectedCommit === commitHash) return;
    setSelectedCommit(commitHash);
    setPreviewContent(null);
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
    if (!selectedCommit || !previewContent) return;

    if (!confirm("确定要恢复到选中的版本吗？当前未保存的内容将被覆盖。")) {
      return;
    }

    setReverting(true);
    try {
      const res = await fetch("/api/admin/git/revert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath, commitHash: selectedCommit }),
      });
      const data = await res.json();

      if (data.success) {
        onRevert(previewContent);
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

  const selectedCommitInfo = history.find((c) => c.hash === selectedCommit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>历史版本</DialogTitle>
          <DialogDescription className="truncate">
            {filePath}
          </DialogDescription>
        </DialogHeader>

        {/* 主体：左右分栏 */}
        <div className="flex flex-1 min-h-0 divide-x divide-[var(--color-border)]">
          {/* 左侧：提交列表 */}
          <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
            <div className="px-4 py-2 text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider border-b border-[var(--color-border)] bg-[var(--color-muted)]/30">
              提交记录
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col gap-2 p-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse rounded-lg bg-[var(--color-muted)] h-16" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-[var(--color-muted-foreground)] text-sm">
                  暂无历史记录
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {history.map((commit) => (
                    <button
                      key={commit.hash}
                      type="button"
                      className={`w-full text-left p-3 rounded-lg transition-all cursor-pointer ${
                        selectedCommit === commit.hash
                          ? "bg-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]/40"
                          : "hover:bg-[var(--color-muted)] hover:ring-1 hover:ring-[var(--color-border)]"
                      }`}
                      onClick={() => handleSelectCommit(commit.hash)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-xs font-mono text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-1.5 py-0.5 rounded">
                          {commit.hash.substring(0, 7)}
                        </code>
                        <span className="text-[10px] text-[var(--color-muted-foreground)]">
                          {formatDate(commit.date)}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-foreground)] line-clamp-2 leading-snug">
                        {commit.message}
                      </p>
                      {commit.author && (
                        <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1 truncate">
                          {commit.author}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：预览区 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 预览标题栏 */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-muted)]/30 flex-shrink-0">
              <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                {selectedCommitInfo ? (
                  <>
                    <code className="text-[var(--color-primary)] font-mono">
                      {selectedCommitInfo.hash.substring(0, 7)}
                    </code>
                    <span>·</span>
                    <span className="truncate max-w-[300px]">{selectedCommitInfo.message}</span>
                  </>
                ) : (
                  <span>选择左侧提交记录以预览</span>
                )}
              </div>
              {/* 视图切换 Tab */}
              {previewContent && (
                <div className="flex rounded-md overflow-hidden border border-[var(--color-border)] text-xs">
                  {(["rendered", "diff", "raw"] as PreviewTab[]).map((tab, i) => (
                    <button
                      key={tab}
                      type="button"
                      className={`px-3 py-1 transition-colors ${
                        i > 0 ? "border-l border-[var(--color-border)]" : ""
                      } ${
                        previewTab === tab
                          ? "bg-[var(--color-primary)] text-white"
                          : "hover:bg-[var(--color-muted)]"
                      }`}
                      onClick={() => setPreviewTab(tab)}
                    >
                      {tab === "rendered" ? "渲染" : tab === "diff" ? "Diff" : "源文件"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 预览内容 */}
            <div className="flex-1 overflow-y-auto">
              {previewLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3 text-[var(--color-muted-foreground)]">
                    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">加载中...</span>
                  </div>
                </div>
              ) : previewContent !== null ? (
                previewTab === "rendered" ? (
                  <div className="p-6">
                    <MarkdownViewer content={previewContent} className="prose prose-sm dark:prose-invert max-w-none" />
                  </div>
                ) : previewTab === "diff" ? (
                  <DiffView diffResult={diffResult} />
                ) : (
                  <pre className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap break-words text-[var(--color-foreground)] bg-[var(--color-muted)]/20 m-3 rounded-lg border border-[var(--color-border)]">
                    {previewContent}
                  </pre>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[var(--color-muted-foreground)] gap-2">
                  <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm">点击左侧提交记录查看文件内容</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button
            onClick={handleRevert}
            disabled={!selectedCommit || !previewContent || reverting}
          >
            {reverting ? "恢复中..." : "恢复到此版本"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Diff 视图子组件 ─────────────────────────────────────────
import type { Change } from "diff";

function DiffView({ diffResult }: { diffResult: Change[] | null }) {
  if (!diffResult) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-muted-foreground)] text-sm">
        无差异数据
      </div>
    );
  }

  // 统计行数
  const addedLines = diffResult.reduce(
    (n, c) => n + (c.added ? (c.value.split("\n").length - 1) : 0),
    0
  );
  const removedLines = diffResult.reduce(
    (n, c) => n + (c.removed ? (c.value.split("\n").length - 1) : 0),
    0
  );

  // 展开所有行（带行号）
  type DiffLine = { type: "added" | "removed" | "context"; text: string };
  const lines: DiffLine[] = [];
  for (const part of diffResult) {
    const partLines = part.value.split("\n");
    // 每个 part 末尾通常有一个空字符串（换行分割产物），跳过
    const effective = partLines[partLines.length - 1] === ""
      ? partLines.slice(0, -1)
      : partLines;
    for (const text of effective) {
      lines.push({
        type: part.added ? "added" : part.removed ? "removed" : "context",
        text,
      });
    }
  }

  const hasChanges = addedLines > 0 || removedLines > 0;

  return (
    <div className="flex flex-col h-full">
      {/* 统计栏 */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-border)] text-xs bg-[var(--color-muted)]/20 flex-shrink-0">
        <span className="font-medium text-[var(--color-muted-foreground)]">
          {hasChanges ? "历史版本 → 当前内容" : "与当前内容完全一致"}
        </span>
        {hasChanges && (
          <>
            <span className="text-green-500 font-mono">+{addedLines}</span>
            <span className="text-red-500 font-mono">-{removedLines}</span>
          </>
        )}
      </div>

      {/* diff 行 */}
      <div className="flex-1 overflow-y-auto font-mono text-xs leading-5">
        {!hasChanges ? (
          <div className="flex items-center justify-center h-32 text-[var(--color-muted-foreground)]">
            无差异
          </div>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, i) => {
                const isAdded = line.type === "added";
                const isRemoved = line.type === "removed";
                return (
                  <tr
                    key={i}
                    className={
                      isAdded
                        ? "bg-green-500/10"
                        : isRemoved
                        ? "bg-red-500/10"
                        : ""
                    }
                  >
                    {/* 符号列 */}
                    <td
                      className={`select-none w-6 text-center border-r border-[var(--color-border)] ${
                        isAdded
                          ? "text-green-500 bg-green-500/20"
                          : isRemoved
                          ? "text-red-500 bg-red-500/20"
                          : "text-[var(--color-muted-foreground)]"
                      }`}
                    >
                      {isAdded ? "+" : isRemoved ? "−" : " "}
                    </td>
                    {/* 内容列 */}
                    <td
                      className={`pl-3 pr-2 whitespace-pre-wrap break-all ${
                        isAdded
                          ? "text-green-700 dark:text-green-300"
                          : isRemoved
                          ? "text-red-700 dark:text-red-300"
                          : "text-[var(--color-foreground)]"
                      }`}
                    >
                      {line.text || " "}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
