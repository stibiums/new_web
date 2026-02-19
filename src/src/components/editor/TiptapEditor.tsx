"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Toolbar } from "./Toolbar";

const lowlight = createLowlight(common);

export interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

export function TiptapEditor({
  content = "",
  onChange,
  placeholder = "开始输入内容...",
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[var(--color-primary)] underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full my-4",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-[var(--color-border)] bg-[var(--color-muted)] p-2 text-left font-bold",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-[var(--color-border)] p-2",
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: "bg-[var(--color-muted)] rounded-lg p-4 font-mono text-sm overflow-x-auto",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base lg:prose-lg max-w-none focus:outline-none min-h-[300px] p-4",
      },
    },
  });

  return (
    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-background)]">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
