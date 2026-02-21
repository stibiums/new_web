"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

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
}

/**
 * MonacoMarkdownEditor - Monaco Editor Markdown 编辑器组件
 *
 * 功能:
 * - Monaco Editor 作为 Markdown 编辑器
 * - Ctrl+S / Cmd+S 保存快捷键
 * - 自动保存功能
 * - 主题跟随系统
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
}: MonacoMarkdownEditorProps) {
  // Monaco Editor 实例引用
  const editorRef = useRef<any>(null);
  // 主题模式
  const [isDark, setIsDark] = useState(true);

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
        // Monaco.KeyMod.CtrlCmd | Monaco.KeyCode.KeyS
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
          const currentValue = editor.getValue();
          onSave?.(currentValue);
        }
      );

      // 设置 Markdown 语言特性
      monaco.languages.setLanguageConfiguration("markdown", {
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
      });
    },
    [onSave]
  );

  // 内容变化处理
  const handleChange = useCallback(
    (value: string | undefined) => {
      onChange?.(value || "");
    },
    [onChange]
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

  return (
    <div className={`monaco-markdown-editor ${className}`} style={{ minHeight }}>
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
          // Markdown 优化
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnEnter: "off",
          tabCompletion: "off",
          wordBasedSuggestions: "off",
        }}
      />
    </div>
  );
}

export default MonacoMarkdownEditor;
