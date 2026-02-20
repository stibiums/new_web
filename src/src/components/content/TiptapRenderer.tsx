"use client";

import { useMemo, useState, useEffect } from "react";
import YooptaEditor, {
  createYooptaEditor,
  type YooptaContentValue,
} from "@yoopta/editor";
import { PLUGINS, MARKS } from "@/components/editor/plugins";

interface ContentRendererProps {
  content: string;
  className?: string;
}

export function TiptapRenderer({ content, className = "" }: ContentRendererProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Parse content
  const parsedContent = useMemo(() => {
    if (!content) return null;
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
        return parsed as YooptaContentValue;
      }
    } catch {
      // Not valid Yoopta JSON - might be old Tiptap format or raw HTML
      return null;
    }
    return null;
  }, [content]);

  // Create a readonly editor instance
  const editor = useMemo(() => {
    return createYooptaEditor({
      plugins: PLUGINS,
      marks: MARKS,
      value: parsedContent || undefined,
      readOnly: true,
    });
  }, [parsedContent]);

  if (!content) {
    return <p className="text-muted-foreground">暂无内容</p>;
  }

  // If content is not Yoopta JSON, render as raw HTML (for backward compat)
  if (!parsedContent) {
    return (
      <div
        className={`prose prose-lg dark:prose-invert max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  if (!isMounted) {
    return (
      <div className={`prose prose-lg dark:prose-invert max-w-none ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>
      </div>
    );
  }

  return (
    <div className={`yoopta-renderer ${className}`}>
      <YooptaEditor
        editor={editor}
        style={{ width: "100%" }}
      />
    </div>
  );
}
