"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Command } from "@tiptap/suggestion";
import { Editor } from "@tiptap/react";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
} from "lucide-react";

export interface SuggestionListRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
  updateProps: (props: Partial<SuggestionListProps>) => void;
}

interface SuggestionListProps {
  items: any[];
  command: (item: any) => void;
  clientRect?: () => DOMRect | null;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  H1: Heading1,
  H2: Heading2,
  H3: Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
};

export const SuggestionList = forwardRef<SuggestionListRef, SuggestionListProps>(
  function SuggestionList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    };

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((selectedIndex + 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
      updateProps: (props: Partial<SuggestionListProps>) => {
        if (props.items) {
          // items updated
        }
      },
    }));

    if (items.length === 0) {
      return null;
    }

    return (
      <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden min-w-[200px]">
        <div className="p-1 text-xs text-[var(--color-muted-foreground)] border-b border-[var(--color-border)]">
          插入块
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {items.map((item, index) => {
            const Icon = iconMap[item.icon] || List;
            return (
              <button
                key={index}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  index === selectedIndex
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "hover:bg-[var(--color-muted)]"
                }`}
                onClick={() => selectItem(index)}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{item.title}</div>
                  {item.description && (
                    <div
                      className={`text-xs truncate ${
                        index === selectedIndex
                          ? "text-[var(--color-primary-foreground)]/70"
                          : "text-[var(--color-muted-foreground)]"
                      }`}
                    >
                      {item.description}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

export function createSuggestionItems(query: string) {
  return getSuggestionItems();
}

function getSuggestionItems() {
  return [
    {
      title: "标题 1",
      description: "大标题",
      icon: "H1",
      searchTerms: ["title", "heading", "h1"],
      command: ({}: any) => {},
    },
    {
      title: "标题 2",
      description: "中标题",
      icon: "H2",
      searchTerms: ["title", "heading", "h2"],
      command: ({}: any) => {},
    },
    {
      title: "标题 3",
      description: "小标题",
      icon: "H3",
      searchTerms: ["title", "heading", "h3"],
      command: ({}: any) => {},
    },
    {
      title: "无序列表",
      description: "创建无序列表",
      icon: "List",
      searchTerms: ["bullet", "list", "unordered"],
      command: ({}: any) => {},
    },
    {
      title: "有序列表",
      description: "创建有序列表",
      icon: "ListOrdered",
      searchTerms: ["number", "list", "ordered"],
      command: ({}: any) => {},
    },
    {
      title: "任务列表",
      description: "创建待办事项列表",
      icon: "CheckSquare",
      searchTerms: ["todo", "task", "check"],
      command: ({}: any) => {},
    },
    {
      title: "引用",
      description: "创建引用块",
      icon: "Quote",
      searchTerms: ["quote", "blockquote"],
      command: ({}: any) => {},
    },
    {
      title: "代码块",
      description: "插入代码块",
      icon: "Code",
      searchTerms: ["code", "pre", "codeblock"],
      command: ({}: any) => {},
    },
    {
      title: "分割线",
      description: "插入水平分割线",
      icon: "Minus",
      searchTerms: ["hr", "divider", "horizontal"],
      command: ({}: any) => {},
    },
  ];
}
