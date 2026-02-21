import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  /** Markdown 内容 */
  content: string;
  /** 自定义样式类 */
  className?: string;
}

/**
 * MarkdownRenderer - 使用 react-markdown 渲染 Markdown 内容
 *
 * 支持:
 * - GFM (GitHub Flavored Markdown): 表格、任务列表、删除线等
 * - 代码高亮 (需配合 rehype-highlight)
 * - 自动链接
 */
export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) {
    return <p className="text-muted-foreground">暂无内容</p>;
  }

  return (
    <div className={`prose prose-lg dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
