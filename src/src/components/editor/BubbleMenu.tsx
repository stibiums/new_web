"use client";

import { Editor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/extension-bubble-menu";
import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Link,
} from "lucide-react";
import { Button } from "../ui/Button";

interface BubbleMenuButtonProps {
  editor: Editor;
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title?: string;
}

function BubbleMenuButton({
  editor,
  onClick,
  isActive,
  children,
  title,
}: BubbleMenuButtonProps) {
  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="icon"
      className="h-8 w-8"
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );
}

interface BubbleMenuWrapperProps {
  editor: Editor;
}

export function BubbleMenuWrapper({ editor }: BubbleMenuWrapperProps) {
  if (!editor) {
    return null;
  }

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("输入链接地址:", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <TiptapBubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100 }}
      className="flex items-center gap-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg shadow-lg p-1"
    >
      <BubbleMenuButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="粗体"
      >
        <Bold className="h-4 w-4" />
      </BubbleMenuButton>

      <BubbleMenuButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="斜体"
      >
        <Italic className="h-4 w-4" />
      </BubbleMenuButton>

      <BubbleMenuButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="删除线"
      >
        <Strikethrough className="h-4 w-4" />
      </BubbleMenuButton>

      <BubbleMenuButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="行内代码"
      >
        <Code className="h-4 w-4" />
      </BubbleMenuButton>

      <div className="w-px h-6 bg-[var(--color-border)] mx-1" />

      <BubbleMenuButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title="标题 1"
      >
        <Heading1 className="h-4 w-4" />
      </BubbleMenuButton>

      <BubbleMenuButton
        editor={editor}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="标题 2"
      >
        <Heading2 className="h-4 w-4" />
      </BubbleMenuButton>

      <div className="w-px h-6 bg-[var(--color-border)] mx-1" />

      <BubbleMenuButton
        editor={editor}
        onClick={handleSetLink}
        isActive={editor.isActive("link")}
        title="链接"
      >
        <Link className="h-4 w-4" />
      </BubbleMenuButton>
    </TiptapBubbleMenu>
  );
}
