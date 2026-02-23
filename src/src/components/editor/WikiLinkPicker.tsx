"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, BookOpen, FileText, FolderOpen, Loader2 } from "lucide-react";

export interface WikiLinkPickerItem {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  nodeType: "BLOG" | "NOTE" | "PROJECT";
}

export interface WikiLinkPickerProps {
  /** 确认选择某个内容时的回调，传入完整 item */
  onSelect: (item: WikiLinkPickerItem) => void;
  /** 关闭 Picker（Esc 或点击外部）*/
  onClose: () => void;
  /** 定位用的锚点位置，相对于外层容器 */
  anchorPosition?: { x: number; y: number };
  /** 初始搜索词（如用户已输入了 [[ 后面的字符）*/
  initialQuery?: string;
}

const NODE_TYPE_CONFIG: Record<
  WikiLinkPickerItem["nodeType"],
  { label: string; icon: React.ElementType; color: string }
> = {
  NOTE: { label: "笔记", icon: BookOpen, color: "bg-blue-500/15 text-blue-500" },
  BLOG: { label: "文章", icon: FileText, color: "bg-green-500/15 text-green-500" },
  PROJECT: { label: "项目", icon: FolderOpen, color: "bg-purple-500/15 text-purple-500" },
};

export function WikiLinkPicker({
  onSelect,
  onClose,
  anchorPosition,
  initialQuery = "",
}: WikiLinkPickerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<WikiLinkPickerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 挂载后聚焦搜索框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 初始查询（无关键词时拉取最近内容）
  useEffect(() => {
    fetchItems(initialQuery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchItems = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/content-list?q=${encodeURIComponent(q)}&limit=8`
      );
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.data || []);
      setActiveIndex(0);
    } catch {
      // 忽略错误
    } finally {
      setLoading(false);
    }
  }, []);

  // 输入时 debounce 搜索
  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchItems(value), 250);
  };

  // 键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[activeIndex]) {
        onSelect(items[activeIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // 计算弹出位置（优先向下，靠近右侧时向左偏移）
  const style: React.CSSProperties = anchorPosition
    ? { position: "absolute", left: anchorPosition.x, top: anchorPosition.y, zIndex: 1000 }
    : { position: "absolute", left: "50%", top: "20%", transform: "translateX(-50%)", zIndex: 1000 };

  return (
    <div
      ref={containerRef}
      className="w-80 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl overflow-hidden"
      style={style}
      onKeyDown={handleKeyDown}
    >
      {/* 搜索框 */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--color-border)]">
        <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="搜索笔记、文章、项目…"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
      </div>

      {/* 结果列表 - 不滚动，全展示，删小按键切换高亮 */}
      <ul className="py-1">
        {items.length === 0 && !loading ? (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">
            {query ? "未找到匹配内容" : "暂无内容"}
          </li>
        ) : (
          items.map((item, i) => {
            const cfg = NODE_TYPE_CONFIG[item.nodeType];
            const Icon = cfg.icon;
            const isActive = i === activeIndex;
            return (
              <li
                key={item.id}
                className={`flex items-center gap-2.5 py-2 cursor-pointer select-none transition-colors border-l-2
                  ${isActive
                    ? "bg-[var(--color-muted)] border-[var(--color-primary)] pl-[calc(0.75rem-2px)]"
                    : "border-transparent px-3 hover:bg-[var(--color-muted)]/60"
                  }`}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault(); // 防止失焦
                  onSelect(item);
                }}
              >
                {/* 类型 Badge */}
                <span
                  className={`flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.color}`}
                >
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </span>

                {/* 标题 + slug */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.title}</div>
                  <div className="text-[11px] text-muted-foreground truncate font-mono">
                    {item.slug}
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>

      {/* 底部提示 */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-[var(--color-border)] text-[10px] text-muted-foreground">
        <span>↑↓ 导航</span>
        <span>Enter 插入 · Esc 关闭</span>
      </div>
    </div>
  );
}
