"use client";

import { useMemo, useEffect, useCallback, useState, useRef } from "react";
import YooptaEditor, {
  createYooptaEditor,
  type YooptaContentValue,
  type YooEditor,
  Blocks,
  Marks,
  useYooptaEditor,
} from "@yoopta/editor";
import { FloatingToolbar } from "@yoopta/ui/floating-toolbar";
import { SlashCommandMenu } from "@yoopta/ui/slash-command-menu";
import { FloatingBlockActions } from "@yoopta/ui/floating-block-actions";
import { BlockOptions } from "@yoopta/ui/block-options";
import { SelectionBox } from "@yoopta/ui/selection-box";
import { PLUGINS, MARKS } from "./plugins";

// ---- Slash Command Menu ----
function EditorSlashCommand() {
  return (
    <SlashCommandMenu>
      {({ groupedItems }) => (
        <SlashCommandMenu.Content>
          <SlashCommandMenu.Input placeholder="搜索块类型..." />
          <SlashCommandMenu.List>
            {Array.from(groupedItems.entries()).map(([group, items]) => (
              <SlashCommandMenu.Group key={group} heading={group}>
                {items.map((item) => (
                  <SlashCommandMenu.Item
                    key={item.title}
                    value={item.title ?? ""}
                    title={item.title}
                    description={item.description}
                    icon={item.icon}
                  />
                ))}
              </SlashCommandMenu.Group>
            ))}
          </SlashCommandMenu.List>
          <SlashCommandMenu.Empty>无匹配结果</SlashCommandMenu.Empty>
        </SlashCommandMenu.Content>
      )}
    </SlashCommandMenu>
  );
}

// ---- Floating Toolbar (text formatting) ----
function EditorFloatingToolbar() {
  const editor = useYooptaEditor();

  return (
    <FloatingToolbar>
      <FloatingToolbar.Content>
        <FloatingToolbar.Group>
          {editor.formats.bold && (
            <FloatingToolbar.Button
              onClick={() => Marks.toggle(editor, { type: "bold" })}
              active={Marks.isActive(editor, { type: "bold" })}
              title="粗体 (⌘B)"
            >
              B
            </FloatingToolbar.Button>
          )}
          {editor.formats.italic && (
            <FloatingToolbar.Button
              onClick={() => Marks.toggle(editor, { type: "italic" })}
              active={Marks.isActive(editor, { type: "italic" })}
              title="斜体 (⌘I)"
            >
              <em>I</em>
            </FloatingToolbar.Button>
          )}
          {editor.formats.underline && (
            <FloatingToolbar.Button
              onClick={() => Marks.toggle(editor, { type: "underline" })}
              active={Marks.isActive(editor, { type: "underline" })}
              title="下划线 (⌘U)"
            >
              <u>U</u>
            </FloatingToolbar.Button>
          )}
          {editor.formats.strike && (
            <FloatingToolbar.Button
              onClick={() => Marks.toggle(editor, { type: "strike" })}
              active={Marks.isActive(editor, { type: "strike" })}
              title="删除线"
            >
              <s>S</s>
            </FloatingToolbar.Button>
          )}
          {editor.formats.code && (
            <FloatingToolbar.Button
              onClick={() => Marks.toggle(editor, { type: "code" })}
              active={Marks.isActive(editor, { type: "code" })}
              title="行内代码 (⌘E)"
            >
              {"</>"}
            </FloatingToolbar.Button>
          )}
          {editor.formats.highlight && (
            <FloatingToolbar.Button
              onClick={() => Marks.toggle(editor, { type: "highlight" })}
              active={Marks.isActive(editor, { type: "highlight" })}
              title="高亮"
            >
              H
            </FloatingToolbar.Button>
          )}
        </FloatingToolbar.Group>
      </FloatingToolbar.Content>
    </FloatingToolbar>
  );
}

// ---- Floating Block Actions (plus button, drag handle) ----
function EditorFloatingBlockActions() {
  const editor = useYooptaEditor();
  const [blockOptionsOpen, setBlockOptionsOpen] = useState(false);
  const dragHandleRef = useRef<HTMLButtonElement>(null);

  return (
    <FloatingBlockActions frozen={blockOptionsOpen}>
      {({ blockId }) => (
        <>
          <FloatingBlockActions.Button
            onClick={() => {
              if (!blockId) return;
              const block = Blocks.getBlock(editor, { id: blockId });
              if (block) {
                editor.insertBlock("Paragraph", {
                  at: block.meta.order + 1,
                  focus: true,
                });
              }
            }}
            title="添加块"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </FloatingBlockActions.Button>
          <FloatingBlockActions.Button
            ref={dragHandleRef}
            onClick={() => setBlockOptionsOpen(true)}
            title="拖拽或点击打开菜单"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          </FloatingBlockActions.Button>

          <BlockOptions
            open={blockOptionsOpen}
            onOpenChange={setBlockOptionsOpen}
            anchor={dragHandleRef.current}
          >
            <BlockOptions.Content>
              <BlockOptions.Group>
                <BlockOptions.Item
                  onSelect={() => {
                    if (!blockId) return;
                    Blocks.deleteBlock(editor, { blockId });
                    setBlockOptionsOpen(false);
                  }}
                  variant="destructive"
                >
                  删除
                </BlockOptions.Item>
                <BlockOptions.Item
                  onSelect={() => {
                    if (!blockId) return;
                    Blocks.duplicateBlock(editor, { blockId });
                    setBlockOptionsOpen(false);
                  }}
                >
                  复制
                </BlockOptions.Item>
              </BlockOptions.Group>
            </BlockOptions.Content>
          </BlockOptions>
        </>
      )}
    </FloatingBlockActions>
  );
}

// ---- Main Editor Component ----

export interface YooptaEditorWrapperProps {
  /** Content as JSON string of YooptaContentValue */
  content?: string;
  /** Called with JSON stringified content on change */
  onChange?: (content: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Read-only mode */
  readOnly?: boolean;
  /** CSS class for the editor wrapper */
  className?: string;
}

export function YooptaEditorWrapper({
  content = "",
  onChange,
  placeholder = "输入 / 查看可用命令...",
  readOnly = false,
  className = "",
}: YooptaEditorWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Parse initial value
  const initialValue = useMemo(() => {
    if (!content) return undefined;
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object") {
        return parsed as YooptaContentValue;
      }
    } catch {
      // Not valid JSON
    }
    return undefined;
  }, []);

  const editor = useMemo(
    () =>
      createYooptaEditor({
        plugins: PLUGINS,
        marks: MARKS,
        value: initialValue,
        readOnly,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Set editor value when content prop changes (for edit pages loading data)
  const hasSetInitial = useRef(false);
  useEffect(() => {
    if (!content || !editor) return;
    // Only set value once after initial load to avoid infinite loops
    if (!hasSetInitial.current && content) {
      try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          editor.setEditorValue(parsed);
          hasSetInitial.current = true;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [content, editor]);

  const handleChange = useCallback(
    (value: YooptaContentValue) => {
      if (onChange) {
        onChange(JSON.stringify(value));
      }
    },
    [onChange]
  );

  if (!isMounted) {
    return (
      <div
        className={`min-h-[300px] rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4 ${className}`}
      >
        <div className="text-[var(--color-muted-foreground)]">加载编辑器...</div>
      </div>
    );
  }

  return (
    <div
      className={`yoopta-editor-wrapper rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] ${className}`}
    >
      <YooptaEditor
        editor={editor}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={!readOnly}
        style={{
          width: "100%",
          paddingBottom: readOnly ? 0 : 150,
        }}
      >
        {!readOnly && (
          <>
            <EditorFloatingToolbar />
            <EditorFloatingBlockActions />
            <EditorSlashCommand />
            <SelectionBox />
          </>
        )}
      </YooptaEditor>
    </div>
  );
}
