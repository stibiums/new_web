"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Monitor, Columns, FileCode, History, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MonacoMarkdownEditor } from "./MonacoMarkdownEditor";
import { MarkdownRenderer } from "@/components/content/MarkdownRenderer";
import { GitHistoryDialog } from "./GitHistoryDialog";
import { ResourcePanel, type ContentType } from "./ResourcePanel";

export type ViewMode = "split" | "editor" | "preview";

// ─── 锚点类型：源码行号 → 预览 offsetTop 映射 ─────────────────────────────
interface AnchorPoint {
  /** Markdown 源码行号（1-based） */
  line: number;
  /** 相对预览滚动容器顶部的像素偏移 */
  top: number;
}

/**
 * 将源码行号映射到预览容器 scrollTop（分段线性插值）
 * @param line       目标源码行号
 * @param anchors    锚点表（已按 line 升序排列）
 * @param totalLines 源码总行数
 * @param maxTop     preview.scrollHeight - preview.clientHeight
 */
function lineToPreviewTop(
  line: number,
  anchors: AnchorPoint[],
  totalLines: number,
  maxTop: number
): number {
  if (anchors.length === 0 || maxTop <= 0) return 0;
  const last = anchors[anchors.length - 1];

  // 首锚点之前：从 0 线性插值到第一个锚点
  if (line <= anchors[0].line) {
    if (anchors[0].line <= 1) return anchors[0].top;
    return (line / anchors[0].line) * anchors[0].top;
  }
  // 末锚点之后：从末锚点线性延伸到 maxTop
  if (line >= last.line) {
    if (last.line >= totalLines) return maxTop;
    const tail = totalLines - last.line;
    const frac = Math.min(1, (line - last.line) / tail);
    return last.top + frac * (maxTop - last.top);
  }
  // 二分查找上下界锚点
  let lo = 0, hi = anchors.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (anchors[mid].line <= line) lo = mid;
    else hi = mid;
  }
  const a = anchors[lo], b = anchors[hi];
  if (b.line === a.line) return a.top;
  return a.top + ((line - a.line) / (b.line - a.line)) * (b.top - a.top);
}

/**
 * 将预览容器 scrollTop 映射回源码行号（分段线性插值的逆映射）
 */
function previewTopToLine(
  scrollTop: number,
  anchors: AnchorPoint[],
  totalLines: number,
  maxTop: number
): number {
  if (anchors.length === 0) return 1;
  const last = anchors[anchors.length - 1];

  if (scrollTop <= anchors[0].top) {
    if (anchors[0].top <= 0) return anchors[0].line;
    return Math.max(1, Math.round((scrollTop / anchors[0].top) * anchors[0].line));
  }
  if (scrollTop >= last.top) {
    if (maxTop <= last.top) return last.line;
    const frac = Math.min(1, (scrollTop - last.top) / (maxTop - last.top));
    return Math.round(last.line + frac * (totalLines - last.line));
  }
  let lo = 0, hi = anchors.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (anchors[mid].top <= scrollTop) lo = mid;
    else hi = mid;
  }
  const a = anchors[lo], b = anchors[hi];
  if (b.top === a.top) return a.line;
  return Math.round(a.line + ((scrollTop - a.top) / (b.top - a.top)) * (b.line - a.line));
}

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
  /** 内容类型 (用于资源管理) */
  contentType?: ContentType;
  /** 文章 slug (用于资源管理) */
  slug?: string;
  /** 受控视图模式（不传则内部维护状态） */
  viewMode?: ViewMode;
  /** 视图模式切换回调（配合受控 viewMode 使用） */
  onViewModeChange?: (mode: ViewMode) => void;
  /**
   * 是否隐藏 SplitEditor 自带的视图切换工具栏行
   * （当外部页面工具栏已包含视图切换时，设为 true）
   */
  hideTopBar?: boolean;
}

/**
 * SplitEditor - Overleaf 风格分屏编辑器
 *
 * 功能:
 * - 左右分屏布局：左侧编辑器，右侧 Markdown 预览
 * - 支持分屏/编辑/预览三种模式切换（受控或内部维护）
 * - 资源/历史悬浮图标（不占主工具栏空间）
 * - 可拖拽调整分屏比例
 * - 锁定页面滚动，仅编辑区/预览区可滚动
 * - 编辑区与预览区按比例同步滚动
 * - 预览区选中文字 → 编辑区荧光高亮
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
  contentType,
  slug,
  viewMode: viewModeProp,
  onViewModeChange,
  hideTopBar = false,
}: SplitEditorProps) {
  // 内部视图模式（当 viewModeProp 未传时使用）
  const [viewModeInternal, setViewModeInternal] = useState<ViewMode>("split");
  const viewMode = viewModeProp ?? viewModeInternal;
  const setViewMode = useCallback(
    (mode: ViewMode) => {
      if (onViewModeChange) {
        onViewModeChange(mode);
      } else {
        setViewModeInternal(mode);
      }
    },
    [onViewModeChange]
  );

  // 分屏比例
  const [splitRatio, setSplitRatio] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // 资源面板 / 历史版本弹窗
  const [showResourcePanel, setShowResourcePanel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Monaco editor 实例（滚动同步 & 高亮）
  const monacoEditorRef = useRef<any>(null);
  // 预览容器（滚动同步）
  const previewRef = useRef<HTMLDivElement>(null);
  // 防止滚动同步循环
  const isSyncing = useRef(false);
  // 高亮装饰集合
  const decorationsRef = useRef<any>(null);
  // 锚点表：源码行号 → 预览 offsetTop
  const anchorsRef = useRef<AnchorPoint[]>([]);
  // 锚点重建防抖计时器
  const buildAnchorsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── 锁定页面滚动 ───────────────────────────────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      // 清理高亮防抖计时器
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      // 清理锚点重建计时器
      if (buildAnchorsTimerRef.current) clearTimeout(buildAnchorsTimerRef.current);
    };
  }, []);

  // ─── 分隔条拖拽 ─────────────────────────────────────────────────
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

  // ─── 滚动同步：Monaco → Preview ────────────────────────────────
  useEffect(() => {
    const editor = monacoEditorRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;

    const disposable = editor.onDidScrollChange(() => {
      if (isSyncing.current) return;
      const preview = previewRef.current;
      if (!preview) return;
      const previewMax = preview.scrollHeight - preview.clientHeight;
      if (previewMax <= 0) return;

      const anchors = anchorsRef.current;
      if (anchors.length >= 2) {
        // 锚点表就绪：取当前可见范围第一行，通过分段线性映射到预览 scrollTop
        const visibleRanges = editor.getVisibleRanges();
        const topLine: number = visibleRanges[0]?.startLineNumber ?? 1;
        const totalLines: number = editor.getModel()?.getLineCount() ?? 1;
        const targetTop = lineToPreviewTop(topLine, anchors, totalLines, previewMax);
        isSyncing.current = true;
        preview.scrollTop = targetTop;
        requestAnimationFrame(() => { isSyncing.current = false; });
      } else {
        // Fallback：纯比例映射
        const editorScrollTop = editor.getScrollTop();
        const editorMax = editor.getScrollHeight() - (editor.getLayoutInfo()?.height ?? 0);
        if (editorMax <= 0) return;
        isSyncing.current = true;
        preview.scrollTop = (editorScrollTop / editorMax) * previewMax;
        requestAnimationFrame(() => { isSyncing.current = false; });
      }
    });

    return () => disposable?.dispose();
  }, [monacoEditorRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 滚动同步：Preview → Monaco ────────────────────────────────
  const handlePreviewScroll = useCallback(() => {
    const editor = monacoEditorRef.current;
    const preview = previewRef.current;
    if (!editor || !preview || isSyncing.current) return;
    const previewMax = preview.scrollHeight - preview.clientHeight;
    if (previewMax <= 0) return;

    const anchors = anchorsRef.current;
    if (anchors.length >= 2) {
      const totalLines: number = editor.getModel()?.getLineCount() ?? 1;
      const targetLine = previewTopToLine(preview.scrollTop, anchors, totalLines, previewMax);
      // 通过 Monaco 公开 API 将行号转换为像素位置
      const targetPixel: number = editor.getTopForLineNumber(targetLine);
      isSyncing.current = true;
      editor.setScrollTop(targetPixel);
      requestAnimationFrame(() => { isSyncing.current = false; });
    } else {
      // Fallback：纯比例映射
      const ratio = preview.scrollTop / previewMax;
      const editorMax = editor.getScrollHeight() - (editor.getLayoutInfo()?.height ?? 0);
      isSyncing.current = true;
      editor.setScrollTop(ratio * editorMax);
      requestAnimationFrame(() => { isSyncing.current = false; });
    }
  }, []);

  // ─── 锚点表建立 ──────────────────────────────────────────────────
  /**
   * 扫描预览容器中所有带 [data-source-line] 的元素，
   * 计算其相对预览容器顶部的累计 offsetTop，建立排序后的锚点列表。
   */
  const buildAnchors = useCallback(() => {
    const preview = previewRef.current;
    if (!preview) return;
    const els = preview.querySelectorAll<HTMLElement>("[data-source-line]");
    const points: AnchorPoint[] = [];
    const seen = new Set<number>();
    els.forEach((el) => {
      const line = parseInt(el.getAttribute("data-source-line") ?? "0", 10);
      if (!line || seen.has(line)) return;
      seen.add(line);
      // 累加 offsetTop 直到到达预览滚动容器（排除容器内 padding 偏移）
      let top = 0;
      let cur: HTMLElement | null = el;
      while (cur && cur !== preview) {
        top += cur.offsetTop;
        cur = cur.offsetParent as HTMLElement | null;
      }
      points.push({ line, top });
    });
    points.sort((a, b) => a.line - b.line);
    anchorsRef.current = points;
  }, []);

  // 内容变化时重建锚点表（延迟 120ms 等待 DOM 渲染稳定）
  useEffect(() => {
    if (buildAnchorsTimerRef.current) clearTimeout(buildAnchorsTimerRef.current);
    buildAnchorsTimerRef.current = setTimeout(buildAnchors, 120);
    return () => {
      if (buildAnchorsTimerRef.current) clearTimeout(buildAnchorsTimerRef.current);
    };
  }, [value, buildAnchors]);

  // 高亮防抖计时器
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── 预览选中 → 编辑区荧光高亮 ──────────────────────────────────
  const clearHighlights = useCallback(() => {
    if (decorationsRef.current) {
      decorationsRef.current.clear();
      decorationsRef.current = null;
    }
  }, []);

  const handlePreviewSelection = useCallback(() => {
    // 防抖 150ms
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => {
      const editor = monacoEditorRef.current;
      const preview = previewRef.current;
      if (!editor) return;

      const selection = window.getSelection();
      const selected = selection?.toString().trim();

      // 空选中 / <2字符 / >120字符 时清除
      if (!selected || selected.length < 2 || selected.length > 120) {
        clearHighlights();
        return;
      }

      const model = editor.getModel();
      if (!model) return;

      // ── 通过 data-source-line 锚点精确定位选中所在块 ─────────────
      // 向上遍历 DOM 寻找最近的 [data-source-line] 祖先
      let anchorLine = 0;
      let nextAnchorLine = 0;
      if (selection && selection.rangeCount > 0 && preview) {
        try {
          const range = selection.getRangeAt(0);
          let node: Node | null = range.startContainer;
          while (node && node !== (preview as Node)) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const lineAttr = (node as HTMLElement).getAttribute("data-source-line");
              if (lineAttr) {
                anchorLine = parseInt(lineAttr, 10);
                break;
              }
            }
            node = node.parentNode;
          }
        } catch { /* ignore */ }
      }

      // 确定块的行范围上界（下一个锚点行 - 1）
      if (anchorLine > 0) {
        const anchors = anchorsRef.current;
        const idx = anchors.findIndex((a) => a.line === anchorLine);
        if (idx >= 0 && idx + 1 < anchors.length) {
          nextAnchorLine = anchors[idx + 1].line - 1;
        } else {
          nextAnchorLine = model.getLineCount();
        }
      }

      // ── Fallback：无锚点时通过比例估算目标行 ─────────────────────
      let targetLine = anchorLine > 0 ? anchorLine : 0;
      if (targetLine === 0) {
        let selectionDocRatio = 0.5;
        if (selection && selection.rangeCount > 0 && preview) {
          try {
            const rect = selection.getRangeAt(0).getBoundingClientRect();
            const previewRect = preview.getBoundingClientRect();
            const absY = preview.scrollTop + (rect.top - previewRect.top);
            selectionDocRatio = Math.max(0, Math.min(1, absY / Math.max(1, preview.scrollHeight)));
          } catch { /* ignore */ }
        }
        targetLine = Math.max(1, Math.round(selectionDocRatio * model.getLineCount()));
      }

      // ── 多策略匹配 ──────────────────────────────────────────────
      let matches: any[] | null = null;

      // Strategy 1: 精确全文匹配（适合普通段落文字）
      matches = model.findMatches(selected, false, false, false, null, false);

      // Strategy 2: 多行选中时，取第一个非空行单独匹配
      // 解决：有序/无序列表多行选中时，选中文本不含行首 "1. " 前缀
      if ((!matches || matches.length === 0) && selected.includes("\n")) {
        const firstLine = selected
          .split("\n")
          .map((l) => l.trim())
          .find((l) => l.length >= 2);
        if (firstLine) {
          matches = model.findMatches(firstLine, false, false, false, null, false);
        }
      }

      // Strategy 3: Markdown 内联标记穿插正则
      // 解决：预览 "abc" 对应源码 "a**bc**" 之类含 inline 标记的情况
      if (!matches || matches.length === 0) {
        const candidate = selected.split("\n")[0].trim().slice(0, 40);
        if (candidate.length >= 2) {
          const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const mdMarker = "(?:[*_~`]+)?";
          const regexStr = escaped.split("").join(mdMarker);
          try {
            matches = model.findMatches(regexStr, false, true, false, null, false);
          } catch { /* 正则构建失败时忽略 */ }
        }
      }

      // Strategy 4: 渲染内容与源码有差距（代码块/数学公式/图片等），
      // 文字匹配失败时，直接用锚点块范围高亮整个块。
      if ((!matches || matches.length === 0) && anchorLine > 0) {
        const endLine = nextAnchorLine > 0 ? nextAnchorLine : anchorLine + 10;
        const blockRange = {
          startLineNumber: anchorLine,
          startColumn: 1,
          endLineNumber: Math.min(endLine, model.getLineCount()),
          endColumn: model.getLineMaxColumn(Math.min(endLine, model.getLineCount())),
        };
        const decoration = [{
          range: blockRange,
          options: {
            inlineClassName: "editor-preview-highlight",
            className: "editor-preview-highlight-line",
          },
        }];
        if (decorationsRef.current) {
          decorationsRef.current.set(decoration);
        } else {
          decorationsRef.current = editor.createDecorationsCollection(decoration);
        }
        editor.revealLineInCenter(anchorLine, 0);
        return;
      }

      if (!matches || matches.length === 0) { clearHighlights(); return; }

      // ── 优先选锚点块范围内的匹配；范围内无匹配则 fallback 到距 targetLine 最近 ──
      let nearest = matches[0];
      let nearestDist = Infinity;

      if (anchorLine > 0 && nextAnchorLine > 0) {
        // 先从块范围内找
        const inRange = matches.filter(
          (m) => m.range.startLineNumber >= anchorLine && m.range.startLineNumber <= nextAnchorLine
        );
        if (inRange.length > 0) {
          nearest = inRange[0];
          nearestDist = 0;
        }
      }
      if (nearestDist === Infinity) {
        for (const match of matches) {
          const dist = Math.abs(match.range.startLineNumber - targetLine);
          if (dist < nearestDist) { nearestDist = dist; nearest = match; }
        }
      }

      const decoration = [{
        range: nearest.range,
        options: {
          inlineClassName: "editor-preview-highlight",
          className: "editor-preview-highlight-line",
        },
      }];

      if (decorationsRef.current) {
        decorationsRef.current.set(decoration);
      } else {
        decorationsRef.current = editor.createDecorationsCollection(decoration);
      }

      editor.revealRangeInCenter(nearest.range, 0);
    }, 150);
  }, [clearHighlights]);

  // 内容变化时清除高亮
  useEffect(() => { clearHighlights(); }, [value, clearHighlights]);

  // ─── 资源插入 ───────────────────────────────────────────────────
  const handleInsertResource = useCallback((markdown: string) => {
    const event = new CustomEvent("insert-resource", { detail: markdown });
    window.dispatchEvent(event);
    setShowResourcePanel(false);
  }, []);

  // ─── 历史版本恢复 ────────────────────────────────────────────────
  const handleRevert = useCallback(
    (content: string) => {
      onChange?.(content);
      setTimeout(() => { onSave?.(content); }, 100);
    },
    [onChange, onSave]
  );

  // ─── 视图切换按钮组 ──────────────────────────────────────────────
  const viewModeButtons = (
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
  );

  // ─── 悬浮操作按钮（资源 + 历史），绝对定位于编辑器右上角 ────────
  const floatingActions = (
    <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
      <button
        onClick={() => setShowResourcePanel(true)}
        disabled={readOnly}
        title="资源管理"
        className="w-7 h-7 flex items-center justify-center rounded-md bg-[var(--color-muted)]/80 hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors backdrop-blur-sm"
      >
        <FolderOpen className="w-3.5 h-3.5" />
      </button>
      {filePath && (
        <button
          onClick={() => setShowHistory(true)}
          disabled={readOnly}
          title="历史版本"
          className="w-7 h-7 flex items-center justify-center rounded-md bg-[var(--color-muted)]/80 hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors backdrop-blur-sm"
        >
          <History className="w-3.5 h-3.5" />
        </button>
      )}
      {currentCommit && (
        <code className="text-xs bg-[var(--color-muted)]/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[var(--color-muted-foreground)]">
          {currentCommit.substring(0, 7)}
        </code>
      )}
    </div>
  );

  // Monaco editor mount 回调
  const handleEditorMount = useCallback((editor: any) => {
    monacoEditorRef.current = editor;
  }, []);

  return (
    <div className={`split-editor h-full flex flex-col ${className}`}>
      {/* 内部工具栏（hideTopBar=true 时由页面工具栏提供视图切换） */}
      {!hideTopBar && (
        <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-muted)]/30">
          {viewModeButtons}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResourcePanel(true)}
              disabled={readOnly}
              title="资源管理"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="ml-1 hidden sm:inline">资源</span>
            </Button>
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
            {currentCommit && (
              <code className="text-xs bg-[var(--color-muted)] px-1.5 py-0.5 rounded text-[var(--color-muted-foreground)]">
                {currentCommit.substring(0, 7)}
              </code>
            )}
          </div>
        </div>
      )}

      {/* 编辑区域 */}
      <div ref={containerRef} className="flex-1 min-h-0">
        {viewMode === "split" ? (
          <div className="flex h-full">
            {/* 左侧：编辑器（含悬浮操作按钮） */}
            <div
              style={{ width: `${splitRatio}%` }}
              className="relative h-full border-r border-[var(--color-border)] overflow-hidden"
            >
              {floatingActions}
              <MonacoMarkdownEditor
                value={value}
                onChange={onChange}
                onSave={onSave}
                readOnly={readOnly}
                loading={loading}
                minHeight={minHeight}
                filePath={filePath}
                currentCommit={currentCommit}
                contentType={contentType}
                slug={slug}
                hideToolbar
                onEditorMount={handleEditorMount}
              />
            </div>

            {/* 分隔条 */}
            <div
              className="w-1 bg-[var(--color-border)] hover:bg-primary transition-colors cursor-col-resize flex-shrink-0"
              onMouseDown={handleMouseDown}
            />

            {/* 右侧：预览 */}
            <div
              ref={previewRef}
              style={{ width: `${100 - splitRatio}%` }}
              className="h-full overflow-auto bg-[var(--color-background)]"
              onScroll={handlePreviewScroll}
              onMouseUp={handlePreviewSelection}
            >
              <div className="p-4">
                <MarkdownRenderer content={value} enableSourceLines />
              </div>
            </div>
          </div>
        ) : viewMode === "editor" ? (
          <div className="relative h-full">
            {floatingActions}
            <MonacoMarkdownEditor
              value={value}
              onChange={onChange}
              onSave={onSave}
              readOnly={readOnly}
              loading={loading}
              minHeight={minHeight}
              filePath={filePath}
              currentCommit={currentCommit}
              contentType={contentType}
              slug={slug}
              hideToolbar
              onEditorMount={handleEditorMount}
            />
          </div>
        ) : (
          <div
            ref={previewRef}
            className="h-full overflow-auto bg-[var(--color-background)]"
            onMouseUp={handlePreviewSelection}
          >
            <div className="p-4">
              <MarkdownRenderer content={value} enableSourceLines />
            </div>
          </div>
        )}
      </div>

      {/* 资源管理面板 */}
      {showResourcePanel && (
        <ResourcePanel
          contentType={contentType || "posts"}
          slug={slug || ""}
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

export default SplitEditor;
