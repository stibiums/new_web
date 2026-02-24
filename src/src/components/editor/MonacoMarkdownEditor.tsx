"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, History, Image as ImageIcon, FileText, Video, FileCode, Link2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GitHistoryDialog } from "./GitHistoryDialog";
import { WikiLinkPicker, type WikiLinkPickerItem } from "./WikiLinkPicker";
import type { ContentType } from "./ResourcePanel";

export interface MonacoMarkdownEditorProps {
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
  /** 文件路径（用于 Git 历史） */
  filePath?: string;
  /** 当前 Git commit */
  currentCommit?: string | null;
  /** 是否隐藏工具栏 */
  hideToolbar?: boolean;
  /** 内容类型 (用于资源上传路径) */
  contentType?: ContentType;
  /** 文章 slug (用于资源上传路径) */
  slug?: string;
  /** 编辑器 mount 回调，用于向上传递 editor 实例 */
  onEditorMount?: (editor: any) => void;
  /** 隐藏滚动条（分屏模式下由预览区统一控制滚动时使用） */
  hideScrollbar?: boolean;
}

/**
 * MonacoMarkdownEditor - Monaco Editor Markdown 编辑器组件
 *
 * 功能:
 * - Monaco Editor 作为 Markdown 编辑器
 * - Ctrl+S / Cmd+S 保存快捷键
 * - 主题跟随系统
 * - Git 历史版本查看
 * - 图片拖拽/粘贴上传
 */
export function MonacoMarkdownEditor({
  value,
  onChange,
  onSave,
  readOnly = false,
  loading,
  className = "",
  minHeight = "100%",
  filePath,
  currentCommit,
  hideToolbar = false,
  contentType,
  slug,
  onEditorMount,
  hideScrollbar = false,
}: MonacoMarkdownEditorProps) {
  // Monaco Editor 实例引用
  const editorRef = useRef<any>(null);
  // 编辑器容器引用（用于拖拽上传）
  const containerRef = useRef<HTMLDivElement>(null);
  // 主题模式
  const [isDark, setIsDark] = useState(true);
  // 历史弹窗状态
  const [showHistory, setShowHistory] = useState(false);
  // 上传中状态
  const [uploading, setUploading] = useState(false);
  // 拖拽悬停状态
  const [dragOverEditor, setDragOverEditor] = useState(false);
  // Wiki 链接 Picker 状态
  const [showWikiPicker, setShowWikiPicker] = useState(false);
  const [wikiPickerQuery, setWikiPickerQuery] = useState("");
  // 触发 [[ 时的光标起始位置（用于后续替换）
  const wikiTriggerPos = useRef<{ lineNumber: number; column: number } | null>(null);
  // 正在执行 wiki 链接插入时置为 true，防止 onDidChangeModelContent 重复触发 picker
  const isInsertingWikiLink = useRef(false);

  // 检测系统主题
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // 监听 insert-resource 自定义事件（从 ResourcePanel 触发）
  useEffect(() => {
    const handleInsertResource = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const markdown = customEvent.detail;
      const editor = editorRef.current;
      if (!editor || !markdown) return;

      const position = editor.getPosition();
      if (position) {
        editor.executeEdits("insert-resource", [
          {
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
            text: markdown,
          },
        ]);
        editor.focus();
      }
    };

    window.addEventListener("insert-resource", handleInsertResource);
    return () => window.removeEventListener("insert-resource", handleInsertResource);
  }, []);

  // 处理编辑器 mount
  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      // 向上暴露 editor 实例
      onEditorMount?.(editor);

      // 注册 Ctrl+S / Cmd+S 保存快捷键
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
          const currentValue = editor.getValue();
          onSave?.(currentValue);
        }
      );

      // 监听内容变化，确保实时更新，同时检测 [[ 触发 Wiki 链接 Picker
      editor.onDidChangeModelContent(() => {
        const currentValue = editor.getValue();
        onChange?.(currentValue);

        // 检测光标前两字符是否为 [[（守卫：wiki 链接插入过程中不触发）
        if (!isInsertingWikiLink.current) {
          const position = editor.getPosition();
          if (position) {
            const model = editor.getModel();
            if (model) {
              const col = position.column;
              const line = model.getLineContent(position.lineNumber);
              const charsBefore = line.substring(0, col - 1);
              if (charsBefore.endsWith("[[")) {
                // 记录触发位置（[[ 开始的位置）
                wikiTriggerPos.current = {
                  lineNumber: position.lineNumber,
                  column: col - 2, // [[ 的起始列
                };
                setWikiPickerQuery("");
                setShowWikiPicker(true);
              }
            }
          }
        }
      });

      // 设置 Markdown 语言特性
      monaco.languages.setLanguageConfiguration("markdown", {
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
      });
    },
    [onChange, onSave, onEditorMount]
  );

  // 通用的资源上传处理
  const handleUpload = async (file: File, editor: any) => {
    if (uploading) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // 传入 per-article 路径参数
      if (contentType) formData.append("contentType", contentType);
      if (slug) formData.append("slug", slug);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        const position = editor.getPosition();
        let markdown = "";

        // 根据文件类型生成不同的 Markdown 语法
        if (data.type === "img") {
          markdown = `![${file.name}](${data.url})\n`;
        } else if (data.type === "pdf") {
          markdown = `[${file.name}](${data.url})\n`;
        } else if (data.type === "video") {
          markdown = `<video src="${data.url}" controls></video>\n`;
        } else if (data.type === "jupyter") {
          markdown = `[${file.name}](${data.url})\n`;
        } else {
          markdown = `[${file.name}](${data.url})\n`;
        }

        editor.executeEdits("insert-resource", [
          {
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
            text: markdown,
          },
        ]);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  // 打开文件选择器
  const openFilePicker = (accept: string, type?: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && editorRef.current) {
        if (type) {
          // 指定类型上传
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", type);
          await handleUpload({ ...file, type: type } as File, editorRef.current);
        } else {
          await handleUpload(file, editorRef.current);
        }
      }
    };
    input.click();
  };

  // 内容变化处理 (保留作为备用)
  const handleChange = useCallback(
    (value: string | undefined) => {
      // 这里可以不做处理，因为 onDidChangeModelContent 已经处理了
    },
    []
  );

  // 恢复到历史版本
  // 注意：服务端已在 revert API 中直接同步数据库，无需再次触发 onSave（避免产生额外 git commit）
  const handleRevert = useCallback(
    (content: string) => {
      onChange?.(content);
    },
    [onChange]
  );

  // ─── Wiki 链接 Picker ─────────────────────────────────────────────────────

  /** 工具栏点击"内链"按钮时：重置触发位置，打开 Picker */
  const handleOpenWikiPicker = useCallback(() => {
    wikiTriggerPos.current = null; // null 表示工具栏模式（直接插入，不替换 [[）
    setWikiPickerQuery("");
    setShowWikiPicker(true);
  }, []);

  /**
   * 选中某个 item 后的插入逻辑：
   * - 若由 [[ 自动触发：找到已输入的 [[，整体替换为 [[type/slug]]
   * - 若由工具栏触发：在当前光标处直接插入 [[type/slug]]
   */
  const handleWikiSelect = useCallback((item: WikiLinkPickerItem) => {
    const editor = editorRef.current;
    if (!editor) return;

    // nodeType → URL 路径前缀
    const pathPrefixMap: Record<WikiLinkPickerItem["nodeType"], string> = {
      NOTE: "notes",
      BLOG: "blog",
      PROJECT: "projects",
    };
    const prefix = pathPrefixMap[item.nodeType];
    const insertText = `[[${prefix}/${item.slug}]]`;
    const position = editor.getPosition();

    isInsertingWikiLink.current = true;
    if (wikiTriggerPos.current && position) {
      const trigger = wikiTriggerPos.current;
      // 防御性处理：检查光标后是否存在 Monaco 自动补全插入的 ]]，若有则一并替换
      let endColumn = position.column;
      const model = editor.getModel();
      if (model) {
        const lineContent = model.getLineContent(position.lineNumber);
        const afterCursor = lineContent.substring(position.column - 1);
        if (afterCursor.startsWith("]")) endColumn += 1;
        if (afterCursor.startsWith("]]")) endColumn += 1;
      }
      editor.executeEdits("wiki-link", [
        {
          range: {
            startLineNumber: trigger.lineNumber,
            startColumn: trigger.column,
            endLineNumber: position.lineNumber,
            endColumn,
          },
          text: insertText,
        },
      ]);
    } else if (position) {
      // 工具栏触发：在当前光标处插入
      editor.executeEdits("wiki-link", [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          text: insertText,
        },
      ]);
    }

    isInsertingWikiLink.current = false;
    wikiTriggerPos.current = null;
    setShowWikiPicker(false);
    editor.focus();
  }, []);

  const handleWikiClose = useCallback(() => {
    // 若是 [[ 自动触发后关闭，撤销已输入的 [[
    const editor = editorRef.current;
    if (editor && wikiTriggerPos.current) {
      const trigger = wikiTriggerPos.current;
      const position = editor.getPosition();
      if (position) {
        editor.executeEdits("wiki-link-cancel", [
          {
            range: {
              startLineNumber: trigger.lineNumber,
              startColumn: trigger.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
            text: "",
          },
        ]);
      }
    }
    wikiTriggerPos.current = null;
    setShowWikiPicker(false);
    editor?.focus();
  }, []);

  // 拖拽上传/插入处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 检查是否有文件或资源 markdown
    if (e.dataTransfer.types.includes("Files") || e.dataTransfer.types.includes("application/x-resource-markdown")) {
      setDragOverEditor(true);
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverEditor(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverEditor(false);

    const editor = editorRef.current;
    if (!editor) return;

    // 情况1: 从 ResourcePanel 拖拽的资源（已有 markdown）
    const resourceMarkdown = e.dataTransfer.getData("application/x-resource-markdown");
    if (resourceMarkdown) {
      const position = editor.getPosition();
      if (position) {
        editor.executeEdits("insert-resource-drag", [
          {
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
            text: resourceMarkdown,
          },
        ]);
        editor.focus();
      }
      return;
    }

    // 情况2: 从系统文件管理器拖入的文件
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      for (const file of Array.from(files)) {
        await handleUpload(file, editor);
      }
    }
  }, [handleUpload]);

  return (
    <div
      ref={containerRef}
      className={`monaco-markdown-editor h-full relative ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 拖拽上传覆盖层 */}
      {dragOverEditor && (
        <div className="absolute inset-0 z-10 bg-primary/5 border-2 border-dashed border-primary rounded-lg flex items-center justify-center pointer-events-none">
          <div className="bg-[var(--color-background)]/90 px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-primary">
            松开以上传/插入文件
          </div>
        </div>
      )}
      {/* 工具栏 - 根据 hideToolbar 控制显示 */}
      {!hideToolbar && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-muted)]/30">
          <div className="flex items-center gap-1">
            {/* 内链 Wiki 链接按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenWikiPicker}
              disabled={readOnly}
              title="插入内链 [[slug]]"
            >
              <Link2 className="w-4 h-4" />
              <span className="ml-1 hidden sm:inline">内链</span>
            </Button>

            {/* 上传图片按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openFilePicker("image/*")}
              disabled={readOnly || uploading}
              title="上传图片"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              <span className="ml-1 hidden sm:inline">图片</span>
            </Button>

            {/* 上传 PDF 按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openFilePicker(".pdf", "pdf")}
              disabled={readOnly || uploading}
              title="上传 PDF"
            >
              <FileText className="w-4 h-4" />
              <span className="ml-1 hidden sm:inline">PDF</span>
            </Button>

            {/* 上传视频按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openFilePicker("video/*", "video")}
              disabled={readOnly || uploading}
              title="上传视频"
            >
              <Video className="w-4 h-4" />
              <span className="ml-1 hidden sm:inline">视频</span>
            </Button>

            {/* 上传 Jupyter 按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openFilePicker(".ipynb,.json", "jupyter")}
              disabled={readOnly || uploading}
              title="上传 Jupyter Notebook"
            >
              <FileCode className="w-4 h-4" />
              <span className="ml-1 hidden sm:inline">Notebook</span>
            </Button>

            {/* 历史版本按钮 */}
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
          </div>

          {/* 当前 Commit 显示 */}
          {currentCommit && (
            <div className="text-xs text-muted-foreground">
              <code className="bg-muted px-1.5 py-0.5 rounded">
                {currentCommit.substring(0, 7)}
              </code>
            </div>
          )}
        </div>
      )}

      {/* 编辑器 */}
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme={isDark ? "vs-dark" : "light"}
        loading={
          loading || (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )
        }
        options={{
          minimap: { enabled: false },
          wordWrap: "on",
          lineNumbers: "on",
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          lineHeight: 24,
          padding: { top: 16, bottom: 16 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          renderWhitespace: "selection",
          readOnly,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          scrollbar: hideScrollbar
            ? { vertical: "hidden", horizontal: "hidden", verticalScrollbarSize: 0, horizontalScrollbarSize: 0 }
            : { vertical: "auto", horizontal: "auto" },
          // Markdown 优化
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnEnter: "off",
          tabCompletion: "off",
          wordBasedSuggestions: "off",
          autoClosingBrackets: "never",
          autoClosingQuotes: "never",
          autoSurround: "never",
          // 允许拖拽
          dragAndDrop: true,
        }}
      />

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

      {/* Wiki 链接 Picker */}
      {showWikiPicker && (
        <WikiLinkPicker
          initialQuery={wikiPickerQuery}
          onSelect={handleWikiSelect}
          onClose={handleWikiClose}
        />
      )}
    </div>
  );
}

export default MonacoMarkdownEditor;
