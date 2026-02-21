"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, History, Image as ImageIcon, FileText, Video, FileCode } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GitHistoryDialog } from "./GitHistoryDialog";

export interface MonacoMarkdownEditorProps {
  /** 文件内容 */
  value: string;
  /** 内容变化回调 */
  onChange?: (value: string) => void;
  /** 保存回调 (Ctrl+S 或自动保存触发) */
  onSave?: (value: string) => void;
  /** 是否只读 */
  readOnly?: boolean;
  /** 自动保存间隔 (毫秒), 0 表示不自动保存 */
  autoSaveInterval?: number;
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
}

/**
 * MonacoMarkdownEditor - Monaco Editor Markdown 编辑器组件
 *
 * 功能:
 * - Monaco Editor 作为 Markdown 编辑器
 * - Ctrl+S / Cmd+S 保存快捷键
 * - 自动保存功能
 * - 主题跟随系统
 * - Git 历史版本查看
 * - 图片拖拽/粘贴上传
 */
export function MonacoMarkdownEditor({
  value,
  onChange,
  onSave,
  readOnly = false,
  autoSaveInterval = 30000, // 默认 30 秒
  loading,
  className = "",
  minHeight = "500px",
  filePath,
  currentCommit,
}: MonacoMarkdownEditorProps) {
  // Monaco Editor 实例引用
  const editorRef = useRef<any>(null);
  // 主题模式
  const [isDark, setIsDark] = useState(true);
  // 历史弹窗状态
  const [showHistory, setShowHistory] = useState(false);
  // 上传中状态
  const [uploading, setUploading] = useState(false);

  // 检测系统主题
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // 处理编辑器 mount
  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;

      // 注册 Ctrl+S / Cmd+S 保存快捷键
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
          const currentValue = editor.getValue();
          onSave?.(currentValue);
        }
      );

      // 监听内容变化，确保实时更新
      editor.onDidChangeModelContent(() => {
        const currentValue = editor.getValue();
        onChange?.(currentValue);
      });

      // 设置 Markdown 语言特性
      monaco.languages.setLanguageConfiguration("markdown", {
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
      });

      // 图片拖拽上传
      editor.onDidDropObservable((event: any) => {
        const files = event?.event?.dataTransfer?.files;
        if (files && files.length > 0) {
          const file = files[0];
          if (file.type.startsWith("image/")) {
            handleImageUpload(file, editor);
          }
        }
      });

      // 粘贴上传图片
      editor.getDomNode()?.addEventListener("paste", (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith("image/")) {
              const file = items[i].getAsFile();
              if (file) {
                handleImageUpload(file, editor);
              }
              break;
            }
          }
        }
      });
    },
    [onChange, onSave]
  );

  // 通用的资源上传处理
  const handleUpload = async (file: File, editor: any) => {
    if (uploading) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

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

  // 自动保存逻辑
  useEffect(() => {
    if (autoSaveInterval <= 0 || readOnly || !onSave) return;

    const timer = setInterval(() => {
      if (editorRef.current) {
        const currentValue = editorRef.current.getValue();
        onSave(currentValue);
      }
    }, autoSaveInterval);

    return () => clearInterval(timer);
  }, [autoSaveInterval, readOnly, onSave]);

  // 恢复到历史版本
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
    <div
      className={`monaco-markdown-editor ${className}`}
      style={{ height: minHeight, minHeight }}
    >
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-muted)]/30">
        <div className="flex items-center gap-1">
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

      {/* 编辑器 */}
      <Editor
        height={`calc(${typeof minHeight === 'number' ? `${minHeight}px` : minHeight} - 44px)`}
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
          // Markdown 优化
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnEnter: "off",
          tabCompletion: "off",
          wordBasedSuggestions: "off",
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
    </div>
  );
}

export default MonacoMarkdownEditor;
