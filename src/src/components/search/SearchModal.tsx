"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FileText, StickyNote } from "lucide-react";

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  excerpt: string | null;
  excerptEn: string | null;
  type: string;
}

interface SearchModalProps {
  locale: string;
}

export function SearchModal({ locale }: SearchModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    // Custom event to open search
    const handleOpenSearch = () => setIsOpen(true);

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("open-search", handleOpenSearch);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("open-search", handleOpenSearch);
    };
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search when query changes
  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.data || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      goToResult(results[selectedIndex]);
    }
  };

  const goToResult = (result: SearchResult) => {
    const path = result.type === "NOTE" ? "/notes" : "/blog";
    router.push(`/${locale}${path}/${result.slug}`);
    setIsOpen(false);
  };

  // Scroll selected item into view
  useEffect(() => {
    const selected = resultsRef.current?.children[selectedIndex] as HTMLElement;
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen) return null;

  const getTitle = (result: SearchResult) => {
    return locale === "en" && result.titleEn ? result.titleEn : result.title;
  };

  const getExcerpt = (result: SearchResult) => {
    const text = locale === "en" && result.excerptEn ? result.excerptEn : result.excerpt;
    if (!text) return "";
    // Highlight matching text
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, "<mark>$1</mark>").slice(0, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-background rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索文章..."
            className="flex-1 bg-transparent outline-none text-lg placeholder:text-muted-foreground"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="px-2 py-1 text-xs bg-muted rounded hover:bg-muted/80"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="p-8 text-center text-muted-foreground">搜索中...</div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">没有找到相关结果</div>
          )}

          {!loading &&
            results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => goToResult(result)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                  index === selectedIndex
                    ? "bg-primary/10"
                    : "hover:bg-muted/50"
                }`}
              >
                {result.type === "NOTE" ? (
                  <StickyNote className="w-5 h-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <FileText className="w-5 h-5 mt-0.5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{getTitle(result)}</div>
                  {getExcerpt(result) && (
                    <div
                      className="text-sm text-muted-foreground line-clamp-2 mt-1"
                      dangerouslySetInnerHTML={{ __html: getExcerpt(result) }}
                    />
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {result.type === "NOTE" ? "笔记" : "博客"}
                </span>
              </button>
            ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground border-t border-border bg-muted/30">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-muted rounded ml-1">↓</kbd>
              导航
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded">Enter</kbd>
              打开
            </span>
          </div>
          <span>搜索 {results.length} 个结果</span>
        </div>
      </div>
    </div>
  );
}
