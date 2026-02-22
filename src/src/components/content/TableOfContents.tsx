"use client";

import React, { useEffect, useState } from "react";
import GithubSlugger from "github-slugger";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isVisible, setIsVisible] = useState(true);
  const tocContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slugger = new GithubSlugger();
    const headings: TocItem[] = [];
    
    // Remove code blocks to avoid matching headings inside them
    const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, "");
    
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(contentWithoutCodeBlocks)) !== null) {
      const level = match[1].length;
      // Remove markdown links, bold, italic, etc. for the text
      let text = match[2].trim();
      text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // Remove links
      text = text.replace(/[*_~`]/g, ""); // Remove formatting
      
      const id = slugger.slug(text);
      
      headings.push({ id, text, level });
    }

    setToc(headings);
  }, [content]);

  useEffect(() => {
    if (toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first intersecting entry
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          const newActiveId = visibleEntries[0].target.id;
          setActiveId(newActiveId);

          // 自动滚动目录容器，使当前激活的项保持在可视区域内
          if (tocContainerRef.current) {
            const activeElement = tocContainerRef.current.querySelector(`[data-id="${newActiveId}"]`);
            if (activeElement) {
              const container = tocContainerRef.current;
              const elementRect = activeElement.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();

              // 增加一个缓冲区域（例如 20px），当元素接近边缘时就开始滚动
              const buffer = 20;
              if (elementRect.top < containerRect.top + buffer || elementRect.bottom > containerRect.bottom - buffer) {
                // 使用 scrollTop 进行平滑滚动，而不是 scrollIntoView，因为 scrollIntoView 可能会导致整个页面滚动
                const offsetTop = (activeElement as HTMLElement).offsetTop;
                const containerHalfHeight = container.clientHeight / 2;
                const elementHalfHeight = activeElement.clientHeight / 2;
                
                container.scrollTo({
                  top: offsetTop - containerHalfHeight + elementHalfHeight,
                  behavior: "smooth"
                });
              }
            }
          }
        }
      },
      { rootMargin: "-100px 0px -80% 0px" }
    );

    toc.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [toc]);

  // 监听滚动，当到达评论区时隐藏目录
  useEffect(() => {
    const handleScroll = () => {
      const giscusContainer = document.querySelector('.giscus');
      if (giscusContainer) {
        const rect = giscusContainer.getBoundingClientRect();
        // 当评论区顶部进入视口（距离视口底部 100px）时，隐藏目录
        if (rect.top < window.innerHeight - 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    // 初始化检查一次
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (toc.length === 0) {
    return null;
  }

  return (
    <div 
      ref={tocContainerRef}
      className={`sticky top-24 max-h-[calc(100vh-20rem)] overflow-y-auto pr-8 scrollbar-hide transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <h3 className="font-semibold mb-4 text-lg">目录</h3>
      <ul className="space-y-2 text-sm">
        {toc.map((item) => (
          <li
            key={item.id}
            data-id={item.id}
            style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}
          >
            <a
              href={`#${item.id}`}
              className={`block py-1 border-l-2 pl-3 transition-colors hover:text-primary ${
                activeId === item.id
                  ? "text-primary font-medium border-primary"
                  : "text-muted-foreground border-transparent hover:border-muted-foreground/30"
              }`}
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(item.id);
                if (element) {
                  // Offset for fixed header
                  const y = element.getBoundingClientRect().top + window.scrollY - 100;
                  window.scrollTo({ top: y, behavior: "smooth" });
                  window.history.pushState(null, "", `#${item.id}`);
                  setActiveId(item.id);
                }
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
