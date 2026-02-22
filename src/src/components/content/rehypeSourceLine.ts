/**
 * rehypeSourceLine
 *
 * Rehype 插件：在块级 HTML 元素上注入 `data-source-line` 属性，
 * 记录该节点对应 Markdown 源码的起始行号。
 *
 * 仅在编辑器中（SplitEditor enableSourceLines=true）激活，
 * 前台博客页面不注入，避免污染生产 DOM。
 *
 * 工作原理：
 * - hast 节点通过 remark-parse 已携带 `position.start.line` 信息
 * - 在 rehypeKatex / rehypeSlug 之前运行，使用原始位置信息
 * - 递归遍历 hast 树（root / element），仅对顶层块级标签添加属性
 * - `dataSourceLine` 在 hast → JSX 转换中渲染为 HTML attribute `data-source-line`
 */

/** 需要打标记的块级标签集合 */
const BLOCK_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "pre", "blockquote",
  "ul", "ol",
  "table",
  "hr",
  "details",
  "figure",
  "section",
  "article",
]);

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  position?: { start?: { line?: number } };
};

/** 递归遍历 hast 节点，对符合条件的块级 element 注入 data-source-line */
function walk(node: HastNode): void {
  // 先递归子节点（深度优先）
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walk(child);
    }
  }

  // 仅处理块级 element
  if (node.type !== "element" || !node.tagName) return;
  if (!BLOCK_TAGS.has(node.tagName)) return;

  // 读取 remark-parse 携带的源码位置信息
  const line = node.position?.start?.line;
  if (typeof line !== "number" || line <= 0) return;

  if (!node.properties) node.properties = {};
  // 在 hast 中，data-source-line 对应属性键 dataSourceLine
  node.properties["dataSourceLine"] = String(line);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rehypeSourceLine = () => (tree: any) => {
  walk(tree as HastNode);
};
