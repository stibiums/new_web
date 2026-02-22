"use client";

import { useEffect, useState } from "react";
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
          setActiveId(visibleEntries[0].target.id);
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

  if (toc.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4">
      <h3 className="font-semibold mb-4 text-lg">目录</h3>
      <ul className="space-y-2 text-sm">
        {toc.map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}
          >
            <a
              href={`#${item.id}`}
              className={`block py-1 transition-colors hover:text-primary ${
                activeId === item.id
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
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
