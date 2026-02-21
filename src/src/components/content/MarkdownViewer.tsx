"use client";

import { useState, useEffect } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Skeleton } from "@/components/ui/Skeleton";

interface MarkdownViewerProps {
  /** Markdown 内容 */
  content: string;
  /** 自定义样式类 */
  className?: string;
}

/**
 * MarkdownViewer - 只读的 Markdown 视图组件
 *
 * 特点:
 * - SSR 友好 (避免 hydration mismatch)
 * - 加载状态显示
 * - 内部使用 MarkdownRenderer
 */
export function MarkdownViewer({ content, className = "" }: MarkdownViewerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    );
  }

  return <MarkdownRenderer content={content} className={className} />;
}

export default MarkdownViewer;
