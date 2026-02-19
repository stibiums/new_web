"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createSuggestionItems, SuggestionList } from "./SuggestionList";
import { Command } from "@tiptap/suggestion";
import { Editor } from "@tiptap/react";

interface SlashCommandOptions {
  editor: Editor;
  clientRect?: () => DOMRect | null;
}

export function slashCommand({ editor, clientRect }: SlashCommandOptions) {
  return {
    char: "/",
    command: ({ editor, range, props }: CommandProps) => {
      props.command({ editor, range });
    },
    items: ({ query }: { query: string }) => {
      return createSuggestionItems(query).filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      );
    },
    render: () => {
      let component: SuggestionList;
      let popup: any;

      return {
        onStart: (props: any) => {
          component = new SuggestionList({
            items: props.items,
            command: props.command,
            clientRect: clientRect,
          });

          popup = tippy("body", {
            getReferenceClientRect: clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          });
        },

        onUpdate: (props: any) => {
          component.updateProps({
            items: props.items,
            command: props.command,
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
          return component.onKeyDown(props.event);
        },

        onExit: () => {
          popup[0].destroy();
          component.destroy();
        },
      };
    },
  };
}

interface CommandProps {
  editor: Editor;
  range: any;
  props: any;
}

// 定义命令项类型
export interface CommandItem {
  title: string;
  description?: string;
  icon: string;
  searchTerms?: string[];
  command: (props: { editor: Editor; range: any }) => void;
}

// 创建所有可用的命令项
export function getSuggestionItems(): CommandItem[] {
  return [
    {
      title: "标题 1",
      description: "大标题",
      icon: "H1",
      searchTerms: ["title", "heading", "h1"],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 1 })
          .run();
      },
    },
    {
      title: "标题 2",
      description: "中标题",
      icon: "H2",
      searchTerms: ["title", "heading", "h2"],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 2 })
          .run();
      },
    },
    {
      title: "标题 3",
      description: "小标题",
      icon: "H3",
      searchTerms: ["title", "heading", "h3"],
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 3 })
          .run();
      },
    },
    {
      title: "无序列表",
      description: "创建无序列表",
      icon: "List",
      searchTerms: ["bullet", "list", "unordered"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "有序列表",
      description: "创建有序列表",
      icon: "ListOrdered",
      searchTerms: ["number", "list", "ordered"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "任务列表",
      description: "创建待办事项列表",
      icon: "CheckSquare",
      searchTerms: ["todo", "task", "check"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: "引用",
      description: "创建引用块",
      icon: "Quote",
      searchTerms: ["quote", "blockquote"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: "代码块",
      description: "插入代码块",
      icon: "Code",
      searchTerms: ["code", "pre", "codeblock"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: "分割线",
      description: "插入水平分割线",
      icon: "Minus",
      searchTerms: ["hr", "divider", "horizontal"],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
  ];
}

export { SuggestionList };
