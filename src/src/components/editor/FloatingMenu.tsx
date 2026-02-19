"use client";

import { Editor } from "@tiptap/react";
import { FloatingMenu as TiptapFloatingMenu } from "@tiptap/extension-floating-menu";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
} from "lucide-react";
import { Button } from "../ui/Button";

interface FloatingMenuWrapperProps {
  editor: Editor;
}

export function FloatingMenuWrapper({ editor }: FloatingMenuWrapperProps) {
  if (!editor) {
    return null;
  }

  return (
    <TiptapFloatingMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      className="flex items-center gap-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg shadow-lg p-1"
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="标题 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="标题 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="标题 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-[var(--color-border)] mx-1" />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="无序列表"
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="有序列表"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        title="任务列表"
      >
        <CheckSquare className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-[var(--color-border)] mx-1" />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="引用"
      >
        <Quote className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="代码块"
      >
        <Code className="h-4 w-4" />
      </Button>
    </TiptapFloatingMenu>
  );
}
