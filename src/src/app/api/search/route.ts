import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Document } from "flexsearch";

interface SearchablePost {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  excerpt: string | null;
  excerptEn: string | null;
  content: string;
  contentEn: string | null;
  tags: string | null;
  type: string;
}

/**
 * Extract plain text from Yoopta JSON content (or raw HTML/text).
 * Yoopta content is Record<string, YooptaBlockData>, each block has a `value` array of Slate nodes.
 */
function extractPlainText(raw: string): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const texts: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const extractFromNode = (node: any) => {
        if (typeof node === "string") {
          texts.push(node);
        } else if (node && typeof node === "object") {
          if (node.text && typeof node.text === "string") {
            texts.push(node.text);
          }
          if (Array.isArray(node.children)) {
            for (const child of node.children) {
              extractFromNode(child);
            }
          }
        }
      };
      // Iterate over each block
      for (const key of Object.keys(parsed)) {
        const block = parsed[key];
        if (block && Array.isArray(block.value)) {
          for (const node of block.value) {
            extractFromNode(node);
          }
        }
      }
      return texts.join(" ");
    }
  } catch {
    // Not JSON — return raw content (might be old HTML or plain text)
  }
  return raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// In-memory search index (rebuilds on server start)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let searchIndex: Document | null = null;
let postsCache: SearchablePost[] = [];

async function buildSearchIndex() {
  const posts = await prisma.post.findMany({
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
  });

  postsCache = posts;

  // Create FlexSearch index
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchIndex = new Document({
    document: {
      id: "id",
      index: ["title", "titleEn", "excerpt", "excerptEn", "content", "contentEn", "tags"],
      store: ["id", "slug", "title", "titleEn", "excerpt", "excerptEn", "type"],
    },
    tokenize: "forward",
    context: true,
  });

  // Add documents to index — extract plain text from Yoopta JSON
  for (const post of posts) {
    searchIndex.add({
      ...post,
      content: extractPlainText(post.content),
      contentEn: extractPlainText(post.contentEn || ""),
      titleEn: post.titleEn || "",
      excerptEn: post.excerptEn || "",
    });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "";

    if (!searchIndex || postsCache.length === 0) {
      await buildSearchIndex();
    }

    if (!query.trim()) {
      return NextResponse.json({ data: [] });
    }

    // Search in FlexSearch
    const results = searchIndex!.search(query, {
      limit: 20,
      enrich: true,
    });

    // Flatten and deduplicate results
    const seen = new Set<string>();
    const hits: SearchablePost[] = [];

    for (const field of results) {
      for (const result of field.result) {
        const doc = result.doc as unknown as SearchablePost;
        if (!seen.has(doc.id)) {
          seen.add(doc.id);
          // Filter by type if specified
          if (!type || doc.type === type) {
            hits.push(doc);
          }
        }
      }
    }

    // Format response with locale support
    const formatted = hits.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      titleEn: post.titleEn,
      excerpt: post.excerpt,
      excerptEn: post.excerptEn,
      type: post.type,
    }));

    return NextResponse.json({ data: formatted });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "搜索失败" }, { status: 500 });
  }
}

// Rebuild index endpoint (for admin)
export async function POST() {
  try {
    await buildSearchIndex();
    return NextResponse.json({ success: true, count: postsCache.length });
  } catch (error) {
    console.error("Failed to rebuild index:", error);
    return NextResponse.json({ error: "重建索引失败" }, { status: 500 });
  }
}
