import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Document } from "flexsearch";

/** Unified document shape stored in FlexSearch */
interface SearchableDocument {
  id: string;
  slug: string;
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  content: string;
  contentEn: string;
  tags: string;
  description: string;
  descriptionEn: string;
  abstract: string;
  authors: string;
  type: string; // BLOG | NOTE | PROJECT | PUBLICATION
}

/**
 * Extract plain text from Yoopta JSON, Markdown, or raw HTML.
 * Yoopta: Record<blockId, { value: SlateNode[] }>
 */
function extractPlainText(raw: string): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const texts: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const walk = (node: any) => {
        if (typeof node === "string") {
          texts.push(node);
        } else if (node && typeof node === "object") {
          if (typeof node.text === "string") texts.push(node.text);
          if (Array.isArray(node.children)) node.children.forEach(walk);
        }
      };
      for (const key of Object.keys(parsed)) {
        const block = parsed[key];
        if (block && Array.isArray(block.value)) block.value.forEach(walk);
      }
      return texts.join(" ").replace(/\s+/g, " ").trim();
    }
  } catch {
    // Not JSON — strip tags and return
  }
  // Strip HTML / Markdown syntax for plain text
  return raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[#*_~[\]()!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract a snippet around the first occurrence of `query` in `text`.
 * Returns up to `maxLen` characters with ellipsis markers.
 */
function extractSnippet(text: string, query: string, maxLen = 160): string {
  if (!text) return "";
  if (!query) return text.slice(0, maxLen);
  const lower = text.toLowerCase();
  const lowerQ = query.toLowerCase();
  const idx = lower.indexOf(lowerQ);
  if (idx === -1) return text.slice(0, maxLen) + (text.length > maxLen ? "…" : "");
  const half = Math.floor((maxLen - lowerQ.length) / 2);
  const start = Math.max(0, idx - half);
  const end = Math.min(text.length, idx + lowerQ.length + half);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = "…" + snippet;
  if (end < text.length) snippet += "…";
  return snippet;
}

// ── In-memory state ──────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let searchIndex: Document | null = null;
/** Maps document id → extracted plain-text content (for snippet generation) */
const contentCache = new Map<string, { text: string; textEn: string }>();

async function buildSearchIndex() {
  // Parallel DB queries for best performance
  const [posts, projects, publications] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        excerpt: true,
        excerptEn: true,
        content: true,
        contentEn: true,
        tags: true,
        type: true,
      },
    }),
    prisma.project.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        description: true,
        descriptionEn: true,
        content: true,
        contentEn: true,
        techStack: true,
      },
    }),
    prisma.publication.findMany({
      select: {
        id: true,
        title: true,
        authors: true,
        venue: true,
        year: true,
        abstract: true,
      },
    }),
  ]);

  // Build new index
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const idx = new Document({
    document: {
      id: "id",
      index: [
        "title", "titleEn",
        "excerpt", "excerptEn",
        "content", "contentEn",
        "tags",
        "description", "descriptionEn",
        "abstract", "authors",
      ],
      store: [
        "id", "slug", "title", "titleEn",
        "excerpt", "excerptEn",
        "type", "description", "descriptionEn",
        "abstract", "authors",
      ],
    },
    tokenize: "forward",
    context: true,
  });

  contentCache.clear();

  // ── Posts & Notes ──────────────────────────────────────────────────────────
  for (const post of posts) {
    const text = extractPlainText(post.content);
    const textEn = extractPlainText(post.contentEn || "");
    contentCache.set(post.id, { text, textEn });
    idx.add({
      id: post.id,
      slug: post.slug,
      title: post.title,
      titleEn: post.titleEn || "",
      excerpt: post.excerpt || "",
      excerptEn: post.excerptEn || "",
      content: text,
      contentEn: textEn,
      tags: post.tags || "",
      description: "",
      descriptionEn: "",
      abstract: "",
      authors: "",
      type: post.type,
    });
  }

  // ── Projects ───────────────────────────────────────────────────────────────
  for (const project of projects) {
    const text = extractPlainText(project.content || "");
    const textEn = extractPlainText(project.contentEn || "");
    contentCache.set(project.id, { text, textEn });
    idx.add({
      id: project.id,
      slug: project.slug,
      title: project.title,
      titleEn: project.titleEn || "",
      excerpt: project.description || "",
      excerptEn: project.descriptionEn || "",
      content: text,
      contentEn: textEn,
      tags: project.techStack || "",
      description: project.description || "",
      descriptionEn: project.descriptionEn || "",
      abstract: "",
      authors: "",
      type: "PROJECT",
    });
  }

  // ── Publications ───────────────────────────────────────────────────────────
  for (const pub of publications) {
    const text = [pub.title, pub.authors, pub.abstract, pub.venue]
      .filter(Boolean)
      .join(" ");
    contentCache.set(pub.id, { text, textEn: text });
    idx.add({
      id: pub.id,
      slug: pub.id, // Publications have no slug — use id for anchor #pub-{id}
      title: pub.title,
      titleEn: "",
      excerpt: pub.abstract || "",
      excerptEn: "",
      content: text,
      contentEn: "",
      tags: "",
      description: pub.abstract || "",
      descriptionEn: "",
      abstract: pub.abstract || "",
      authors: pub.authors,
      type: "PUBLICATION",
    });
  }

  searchIndex = idx;
}

// ── GET /api/search?q=xxx[&type=xxx] ─────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "";

    if (!searchIndex || contentCache.size === 0) {
      await buildSearchIndex();
    }

    if (!query.trim()) {
      return NextResponse.json({ data: [] });
    }

    const results = searchIndex!.search(query, { limit: 30, enrich: true });

    // Flatten + deduplicate
    const seen = new Set<string>();
    const hits: SearchableDocument[] = [];
    for (const field of results) {
      for (const result of field.result) {
        const doc = result.doc as unknown as SearchableDocument;
        if (!seen.has(doc.id) && (!type || doc.type === type)) {
          seen.add(doc.id);
          hits.push(doc);
        }
      }
    }

    // Format — attach content snippets from cache
    const formatted = hits.map((doc) => {
      const cache = contentCache.get(doc.id);
      return {
        id: doc.id,
        slug: doc.slug,
        title: doc.title,
        titleEn: doc.titleEn || null,
        excerpt: doc.excerpt || null,
        excerptEn: doc.excerptEn || null,
        type: doc.type,
        authors: doc.authors || null,
        contentSnippet: cache ? extractSnippet(cache.text, query) : null,
        contentSnippetEn:
          cache?.textEn ? extractSnippet(cache.textEn, query) : null,
      };
    });

    return NextResponse.json({ data: formatted });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "搜索失败" }, { status: 500 });
  }
}

// ── POST /api/search — rebuild index (admin) ─────────────────────────────────
export async function POST() {
  try {
    await buildSearchIndex();
    return NextResponse.json({ success: true, count: contentCache.size });
  } catch (error) {
    console.error("Failed to rebuild index:", error);
    return NextResponse.json({ error: "重建索引失败" }, { status: 500 });
  }
}
