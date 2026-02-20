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
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { Toolbar } from "./Toolbar";
import { BubbleMenuWrapper } from "./BubbleMenu";
import { FloatingMenuWrapper } from "./FloatingMenu";
import { useEffect, useState } from "react";
import tippy from "tippy.js";

const lowlight = createLowlight(common);

export interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

// 命令项类型
interface CommandItem {
  title: string;
  description?: string;
  icon: string;
  searchTerms?: string[];
  command: (props: { editor: any; range: any }) => void;
}

// 获取可用命令
function getSuggestionItems(): CommandItem[] {
  return [
    {
      title: "标题 1",
      description: "大标题",
      icon: "H1",
      searchTerms: ["title", "heading", "h1"],
      command: ({ editor, range }: { editor: any; range: any }) => {
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
      },
    },
    {
      title: "标题 2",
      description: "中标题",
      icon: "H2",
      searchTerms: ["title", "heading", "h2"],
      command: ({ editor, range }: { editor: any; range: any }) => {
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
      },
    },
    {
      title: "标题 3",
      description: "小标题",
      icon: "H3",
      searchTerms: ["title", "heading", "h3"],
      command: ({ editor, range }: { editor: any; range: any }) => {
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
      },
    },
    {
      title: "无序列表",
      description: "创建无序列表",
      icon: "List",
      searchTerms: ["bullet", "list", "unordered"],
      command: ({ editor, range }: { editor: any; range: any }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "有序列表",
      description: "创建有序列表",
      icon: "ListOrdered",
      searchTerms: ["number", "list", "ordered"],
      command: ({ editor, range }: { editor: any; range: any }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "任务列表",
      description: "创建待办事项列表",
      icon: "CheckSquare",
      searchTerms: ["todo", "task", "check"],
      command: ({ editor, range }: { editor: any; range: any }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: "引用",
      description: "创建引用块",
      icon: "Quote",
      searchTerms: ["quote", "blockquote"],
      command: ({ editor, range }: { editor: any; range: any }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: "代码块",
      description: "插入代码块",
      icon: "Code",
      searchTerms: ["code", "pre", "codeblock"],
      command: ({ editor, range }: { editor: any; range: any }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: "分割线",
      description: "插入水平分割线",
      icon: "Minus",
      searchTerms: ["hr", "divider", "horizontal"],
      command: ({ editor, range }: { editor: any; range: any }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
  ];
}

// 创建 Slash 命令扩展
const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

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
        taskList: false,
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
      TaskList.configure({
        HTMLAttributes: {
          class: "task-list pl-0",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "task-item flex items-start gap-2",
        },
      }),
      // Slash 命令扩展
      SlashCommand.configure({
        suggestion: {
          char: "/",
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
                const { clientRect } = props;

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

                  items.forEach((item) => {
                    const button = document.createElement("button");
                    button.className = "suggestion-item";
                    button.style.cssText = "width: 100%; display: flex; align-items: center; gap: 12px; padding: 8px 12px; text-align: left; border: none; background: transparent; cursor: pointer;";
                    button.innerHTML = `
                      <span style="font-size: 14px; font-weight: 500;">${item.title}</span>
                      <span style="font-size: 12px; color: var(--color-muted-foreground);">${item.description || ""}</span>
                    `;
                    button.onmouseenter = () => {
                      button.style.background = "var(--color-muted)";
                    };
                    button.onmouseleave = () => {
                      button.style.background = "transparent";
                    };
                    button.onclick = () => {
                      props.command(item);
                    };
                    list.appendChild(button);
                  });
                };

                renderItems(props.items);

                component = list;

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
                const { items, clientRect } = props;
                const list = component;
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
                  button.onmouseenter = () => {
                    button.style.background = "var(--color-muted)";
                  };
                  button.onmouseleave = () => {
                    button.style.background = "transparent";
                  };
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
                if (component) {
                  component.remove();
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
