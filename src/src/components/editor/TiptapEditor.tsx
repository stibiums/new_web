"use client";

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
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
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import BubbleMenuExtension from "@tiptap/extension-bubble-menu";
import FloatingMenu from "@tiptap/extension-floating-menu";
import Suggestion from "@tiptap/suggestion";
import { slashCommand, getSuggestionItems, CommandItem } from "./slash-command";
import { Toolbar } from "./Toolbar";
import { BubbleMenuWrapper } from "./BubbleMenu";
import { FloatingMenuWrapper } from "./FloatingMenu";
import { useCallback, useEffect, useState } from "react";
import tippy from "tippy.js";

const lowlight = createLowlight(common);

export interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

export function TiptapEditor({
  content = "",
  onChange,
  placeholder = "输入 / 查看可用命令...",
}: TiptapEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        // 禁用默认 taskList，用自定义扩展
        taskList: false,
        // 禁用默认 taskItem，用自定义扩展
        taskItem: false,
      }),
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
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
      // Task List 扩展
      TaskList.configure({
        HTMLAttributes: {
          class: "task-list",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "task-item",
        },
      }),
      // Bubble Menu - 选中文字时显示
      BubbleMenuExtension.configure({
        element: document.createElement("div"),
      }),
      // Floating Menu - 空行时显示
      FloatingMenu.configure({
        element: document.createElement("div"),
      }),
      // Slash 命令
      Suggestion.configure({
        char: "/",
        suggestion: {
          items: ({ query }: { query: string }) => {
            return getSuggestionItems().filter((item) =>
              item.title.toLowerCase().includes(query.toLowerCase()) ||
              item.searchTerms?.some((term) => term.includes(query.toLowerCase()))
            );
          },
          render: () => {
            let component: any;
            let popup: any;

            return {
              onStart: (props: any) => {
                const { editor, clientRect } = props;

                component = {
                  element: document.createElement("div"),
                  props: {
                    items: props.items,
                    command: props.command,
                  },
                  // 渲染列表的简单实现
                  destroy: () => {},
                };

                // 创建建议列表的 DOM
                const list = document.createElement("div");
                list.className = "suggestion-list";
                list.style.cssText = `
                  position: absolute;
                  z-index: 1000;
                  background: var(--color-background);
                  border: 1px solid var(--color-border);
                  border-radius: 8px;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                  min-width: 200px;
                  max-height: 300px;
                  overflow-y: auto;
                `;

                const renderItems = (items: CommandItem[]) => {
                  list.innerHTML = "";
                  const header = document.createElement("div");
                  header.className = "suggestion-header";
                  header.textContent = "插入块";
                  header.style.cssText = "padding: 8px 12px; font-size: 12px; color: var(--color-muted-foreground); border-bottom: 1px solid var(--color-border);";
                  list.appendChild(header);

                  items.forEach((item, index) => {
                    const button = document.createElement("button");
                    button.className = "suggestion-item";
                    button.style.cssText = "width: 100%; display: flex; align-items: center; gap: 12px; padding: 8px 12px; text-align: left; border: none; background: transparent; cursor: pointer;";
                    button.innerHTML = `
                      <span style="font-size: 14px; font-weight: 500;">${item.title}</span>
                      <span style="font-size: 12px; color: var(--color-muted-foreground);">${item.description || ""}</span>
                    `;
                    button.onclick = () => {
                      props.command(item);
                    };
                    list.appendChild(button);
                  });
                };

                renderItems(props.items);

                component.element = list;

                popup = tippy("body", {
                  getReferenceClientRect: clientRect,
                  appendTo: () => document.body,
                  content: list,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },
              onUpdate: (props: any) => {
                const { items } = props;
                const list = component.element;
                list.innerHTML = "";
                const header = document.createElement("div");
                header.className = "suggestion-header";
                header.textContent = "插入块";
                header.style.cssText = "padding: 8px 12px; font-size: 12px; color: var(--color-muted-foreground); border-bottom: 1px solid var(--color-border);";
                list.appendChild(header);

                items.forEach((item: CommandItem) => {
                  const button = document.createElement("button");
                  button.className = "suggestion-item";
                  button.style.cssText = "width: 100%; display: flex; align-items: center; gap: 12px; padding: 8px 12px; text-align: left; border: none; background: transparent; cursor: pointer;";
                  button.innerHTML = `
                    <span style="font-size: 14px; font-weight: 500;">${item.title}</span>
                    <span style="font-size: 12px; color: var(--color-muted-foreground);">${item.description || ""}</span>
                  `;
                  button.onclick = () => {
                    props.command(item);
                  };
                  list.appendChild(button);
                });

                popup[0].setProps({
                  getReferenceClientRect: clientRect,
                });
              },
              onKeyDown: (props: { event: KeyboardEvent }) => {
                if (props.event.key === "Escape") {
                  popup[0].hide();
                  return true;
                }
                return false;
              },
              onExit: () => {
                if (popup && popup[0]) {
                  popup[0].destroy();
                }
                if (component && component.element) {
                  component.element.remove();
                }
              },
            };
          },
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

  if (!isMounted) {
    return null;
  }

  return (
    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-background)]">
      {/* Bubble Menu - 选中文字时显示 */}
      <BubbleMenuWrapper editor={editor!} />

      {/* Floating Menu - 空行时显示 */}
      <FloatingMenuWrapper editor={editor!} />

      {/* 简化版工具栏 - 仅保留撤销/重做 */}
      <Toolbar editor={editor} />

      <EditorContent editor={editor} />
    </div>
  );
}
