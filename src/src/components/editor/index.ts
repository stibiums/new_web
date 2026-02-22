export { MonacoMarkdownEditor } from "./MonacoMarkdownEditor";
export type { MonacoMarkdownEditorProps } from "./MonacoMarkdownEditor";
export { SplitEditor } from "./SplitEditor";
export type { SplitEditorProps } from "./SplitEditor";
export { GitHistoryDialog } from "./GitHistoryDialog";

// YooptaEditorWrapper 和 PLUGINS/MARKS 使用懒加载导入，不在 barrel 中导出
// 因为 @yoopta/themes-shadcn 包含未分层的全局 CSS 重置 (button { background-color: transparent })
// 会覆盖 Tailwind CSS 4 的分层工具类，导致按钮样式异常
// 使用方式:
//   import { YooptaEditorWrapper } from "@/components/editor/YooptaEditorWrapper"
//   import { PLUGINS, MARKS } from "@/components/editor/plugins"
