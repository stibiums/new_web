"use client";

import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

interface TiptapRendererProps {
  content: string;
  className?: string;
}

const extensions = [
  StarterKit,
  Placeholder.configure({
    placeholder: "暂无内容",
  }),
  Link.configure({
    openOnClick: false,
  }),
  Image,
];

export function TiptapRenderer({ content, className = "" }: TiptapRendererProps) {
  if (!content) {
    return <p className="text-muted-foreground">暂无内容</p>;
  }

  try {
    // 解析 JSON
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      // 如果不是 JSON，直接作为 HTML 内容返回
      return (
        <div
          className={`prose prose-lg dark:prose-invert max-w-none ${className}`}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    // 生成 HTML
    const html = generateHTML(parsedContent, extensions);

    return (
      <div
        className={`prose prose-lg dark:prose-invert max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (error) {
    console.error("Failed to render content:", error);
    return <p className="text-muted-foreground">内容渲染失败</p>;
  }
}
