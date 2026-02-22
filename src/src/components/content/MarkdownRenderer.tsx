"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Zoom from "react-medium-image-zoom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// Remark & Rehype Plugins
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeUnwrapImages from "rehype-unwrap-images";
import { rehypeSourceLine } from "./rehypeSourceLine";

// Styles
import "react-medium-image-zoom/dist/styles.css";
import "katex/dist/katex.min.css";

// -----------------------------------------------------------------------------
// Mermaid 动态渲染组件
// -----------------------------------------------------------------------------
const Mermaid = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    import("mermaid").then((mermaidModule) => {
      const mermaid = mermaidModule.default;
      mermaid.initialize({ startOnLoad: false, theme: "default" });
      // 使用随机 ID 防止多个图表冲突
      const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
      mermaid
        .render(id, chart)
        .then((result) => setSvg(result.svg))
        .catch((e) => console.error("Mermaid rendering error:", e));
    });
  }, [chart]);

  if (!svg) {
    return (
      <div className="animate-pulse bg-muted h-32 w-full rounded-md flex items-center justify-center">
        <span className="text-muted-foreground">Loading chart...</span>
      </div>
    );
  }

  return (
    <div
      className="mermaid flex justify-center my-6"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

// -----------------------------------------------------------------------------
// 主渲染组件
// -----------------------------------------------------------------------------
interface MarkdownRendererProps {
  /** Markdown 内容 */
  content: string;
  /** 自定义样式类 */
  className?: string;
  /**
   * 是否向块级元素注入 `data-source-line` 属性（用于编辑器锚点滚动同步）
   * 默认 false，仅在 SplitEditor 中启用，避免污染前台页面 DOM
   */
  enableSourceLines?: boolean;
}

export function MarkdownRenderer({ content, className = "", enableSourceLines = false }: MarkdownRendererProps) {
  if (!content) {
    return <p className="text-muted-foreground">暂无内容</p>;
  }

  // rehypeSourceLine 必须在 rehypeKatex 之前运行，以捕获原始 position 信息
  const rehypePluginList = [
    ...(enableSourceLines ? [rehypeSourceLine] : []),
    rehypeKatex,
    rehypeSlug,
    [rehypeAutolinkHeadings, { behavior: "wrap" }] as any,
    rehypeUnwrapImages,
  ];

  return (
    <div className={`prose prose-lg dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={rehypePluginList}
        components={{
          // 1. 自定义 a 标签 (内部链接使用 next/link)
          a({ href, children, ...props }) {
            if (href && href.startsWith("/")) {
              return (
                <Link href={href} {...props}>
                  {children}
                </Link>
              );
            }
            if (href && href.startsWith("#")) {
              return (
                <a href={href} {...props}>
                  {children}
                </a>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },

          // 2. 自定义 img 标签 (支持图片放大)
          img({ src, alt, ...props }) {
            return (
              <Zoom>
                <img
                  src={src}
                  alt={alt}
                  className="rounded-lg max-w-full h-auto mx-auto"
                  {...props}
                />
              </Zoom>
            );
          },

          // 3. 自定义 code 标签 (支持 Mermaid 和普通代码块)
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";

            if (!inline && language === "mermaid") {
              return <Mermaid chart={String(children).replace(/\n$/, "")} />;
            }

            if (!inline && match) {
              return (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={language}
                  PreTag="div"
                  className="rounded-md !my-4"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              );
            }

            return (
              <code
                className={`${className} ${
                  inline
                    ? "bg-muted rounded px-1.5 py-0.5 text-sm font-mono before:content-none after:content-none"
                    : ""
                }`}
                {...props}
              >
                {children}
              </code>
            );
          },

          // 4. 自定义 blockquote 标签 (支持 GitHub 风格的 Alerts)
          blockquote({ children, ...props }: any) {
            let alertType = "";

            // 遍历子节点，寻找 [!NOTE] 等标记
            const processChildren = React.Children.map(children, (child, index) => {
              if (index === 0 && React.isValidElement(child) && (child.props as any).children) {
                const childProps = child.props as any;
                const firstText = Array.isArray(childProps.children)
                  ? childProps.children[0]
                  : childProps.children;

                if (typeof firstText === "string") {
                  const match = firstText.match(
                    /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i
                  );
                  if (match) {
                    alertType = match[1].toLowerCase();
                    // 移除标记文本
                    const newText = firstText.replace(
                      /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i,
                      ""
                    );
                    const newChildren = Array.isArray(childProps.children)
                      ? [newText, ...childProps.children.slice(1)]
                      : newText;
                    return React.cloneElement(child, {}, newChildren);
                  }
                }
              }
              return child;
            });

            if (alertType) {
              const alertConfig: Record<string, { color: string; icon: string }> = {
                note: {
                  color:
                    "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200",
                  icon: "ℹ️",
                },
                tip: {
                  color:
                    "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200",
                  icon: "💡",
                },
                important: {
                  color:
                    "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200",
                  icon: "❗",
                },
                warning: {
                  color:
                    "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200",
                  icon: "⚠️",
                },
                caution: {
                  color:
                    "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200",
                  icon: "🛑",
                },
              };

              const config = alertConfig[alertType] || alertConfig.note;

              return (
                <div
                  className={`border-l-4 p-4 my-6 rounded-r-md ${config.color}`}
                  {...props}
                >
                  <div className="font-bold mb-2 capitalize flex items-center gap-2">
                    <span>{config.icon}</span>
                    {alertType}
                  </div>
                  <div className="[&>p:last-child]:mb-0 [&>p:first-child]:mt-0">
                    {processChildren}
                  </div>
                </div>
              );
            }

            // 普通的 blockquote
            return (
              <blockquote
                className="border-l-4 border-muted-foreground/50 pl-4 my-4 italic text-muted-foreground"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
