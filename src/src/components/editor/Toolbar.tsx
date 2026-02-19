"use client";

import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Undo,
  Redo,
  Link,
  Image,
  Table,
} from "lucide-react";
import { Button } from "../ui/Button";

interface ToolbarProps {
  editor: Editor | null;
}

export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) {
    return null;
  }

  const handleLinkClick = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleImageClick = () => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleTableInsert = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[var(--color-border)] bg-[var(--color-muted)] rounded-t-lg">
      {/* 撤销/重做 */}
      <div className="flex items-center gap-1 mr-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="撤销"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="重做"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-[var(--color-border)] mx-1" />

      {/* 标题 */}
      <Button
        variant={editor.isActive("heading", { level: 1 }) ? "default" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="标题 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="标题 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="标题 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-[var(--color-border)] mx-1" />

      {/* 格式 */}
      <Button
        variant={editor.isActive("bold") ? "default" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="粗体"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("italic") ? "default" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="斜体"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("code") ? "default" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="行内代码"
      >
        <Code className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-[var(--color-border)] mx-1" />

      {/* 列表 */}
      <Button
        variant={editor.isActive("bulletList") ? "default" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="无序列表"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("orderedList") ? "default" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="有序列表"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("blockquote") ? "default" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="引用"
      >
        <Quote className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-[var(--color-border)] mx-1" />

      {/* 链接和图片 */}
      <Button
        variant={editor.isActive("link") ? "default" : "ghost"}
        size="icon"
        onClick={handleLinkClick}
        title="链接"
      >
        <Link className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={handleImageClick} title="图片">
        <Image className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={handleTableInsert} title="表格">
        <Table className="h-4 w-4" />
      </Button>
    </div>
  );
}
