import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ────────────────────────────────────────────────────────────────────────────────
// 类型定义
// ────────────────────────────────────────────────────────────────────────────────

export type NodeType = "NOTE" | "BLOG" | "PROJECT" | "TAG";

export type EdgeType =
  | "EXPLICIT"         // 手工录入的 PostLink
  | "FRONT_MATTER"     // front matter links: [] 声明
  | "WIKI_LINK"        // 正文 [[slug]] wiki 链接
  | "TAG_COOCCURRENCE" // 共享相同 tag 的节点对
  | "CATEGORY"         // 同 category 的 NOTE 节点对
  | "TAG_NODE";        // 内容节点 → Tag 节点的连线

export interface GraphNode {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  nodeType: NodeType;
  category: string | null;
  tags: string[];
  excerpt: string | null;
  linkCount: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
}

// ────────────────────────────────────────────────────────────────────────────────
// GET /api/graph
// ────────────────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    // 1. 获取所有已发布的 Post (BLOG + NOTE)
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        type: true,
        category: true,
        tags: true,
        excerpt: true,
        links: { select: { targetId: true, type: true } },
        backlinks: { select: { sourceId: true } },
      },
    });

    // 2. 获取所有已发布的 Project
    const projects = await prisma.project.findMany({
      where: { published: true },
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        tags: true,
        description: true,
      },
    });

    // ── 构建节点 ──────────────────────────────────────────────────────────────

    const parseTags = (raw: string | null): string[] => {
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return raw.split(",").map((t) => t.trim()).filter(Boolean);
      }
    };

    const nodes: GraphNode[] = [];
    const nodeIdSet = new Set<string>();

    for (const p of posts) {
      const tags = parseTags(p.tags);
      nodes.push({
        id: p.id,
        slug: p.slug,
        title: p.title,
        titleEn: p.titleEn,
        nodeType: p.type as "BLOG" | "NOTE",
        category: p.category,
        tags,
        excerpt: p.excerpt,
        linkCount: p.links.length + p.backlinks.length,
      });
      nodeIdSet.add(p.id);
    }

    for (const p of projects) {
      const tags = parseTags(p.tags);
      nodes.push({
        id: p.id,
        slug: p.slug,
        title: p.title,
        titleEn: p.titleEn,
        nodeType: "PROJECT",
        category: null,
        tags,
        excerpt: p.description,
        linkCount: 0,
      });
      nodeIdSet.add(p.id);
    }

    // ── 收集所有唯一 Tag，生成虚拟 TAG 节点 ─────────────────────────────────
    const tagSet = new Set<string>();
    for (const n of nodes) {
      for (const t of n.tags) tagSet.add(t);
    }

    const tagNodeMap = new Map<string, string>(); // tag → virtual node id
    for (const tag of tagSet) {
      const id = `tag::${tag}`;
      tagNodeMap.set(tag, id);
      nodes.push({
        id,
        slug: tag,
        title: `#${tag}`,
        titleEn: null,
        nodeType: "TAG",
        category: null,
        tags: [],
        excerpt: null,
        linkCount: 0,
      });
    }

    // ── 构建边 ────────────────────────────────────────────────────────────────
    const edges: GraphEdge[] = [];
    const edgeSet = new Set<string>();

    const addEdge = (source: string, target: string, type: EdgeType) => {
      const key = `${source}→${target}::${type}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({ source, target, type });
      }
    };

    // (A) PostLink 表（EXPLICIT / FRONT_MATTER / WIKI_LINK）
    for (const post of posts) {
      for (const link of post.links) {
        if (nodeIdSet.has(link.targetId)) {
          addEdge(post.id, link.targetId, (link.type as EdgeType) || "EXPLICIT");
        }
      }
    }

    // (B) TAG_NODE 边（内容节点 → Tag 虚拟节点）
    for (const node of [...nodes]) {
      if (node.nodeType === "TAG") continue;
      for (const tag of node.tags) {
        const tagId = tagNodeMap.get(tag);
        if (tagId) addEdge(node.id, tagId, "TAG_NODE");
      }
    }

    // (C) TAG_COOCCURRENCE 边（共享相同 tag 的非 TAG 节点对）
    const tagToNodes = new Map<string, string[]>();
    for (const node of nodes) {
      if (node.nodeType === "TAG") continue;
      for (const tag of node.tags) {
        if (!tagToNodes.has(tag)) tagToNodes.set(tag, []);
        tagToNodes.get(tag)!.push(node.id);
      }
    }
    for (const [, members] of tagToNodes) {
      if (members.length < 2) continue;
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const fwd = `${members[i]}→${members[j]}`;
          const bwd = `${members[j]}→${members[i]}`;
          const alreadyLinked = [...edgeSet].some(
            (k) => k.startsWith(fwd) || k.startsWith(bwd)
          );
          if (!alreadyLinked) {
            addEdge(members[i], members[j], "TAG_COOCCURRENCE");
          }
        }
      }
    }

    // (D) CATEGORY 边（同 category 的 NOTE 节点对）
    const categoryToNotes = new Map<string, string[]>();
    for (const node of nodes) {
      if (node.nodeType === "NOTE" && node.category) {
        if (!categoryToNotes.has(node.category)) categoryToNotes.set(node.category, []);
        categoryToNotes.get(node.category)!.push(node.id);
      }
    }
    for (const [, members] of categoryToNotes) {
      if (members.length < 2) continue;
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const fwd = `${members[i]}→${members[j]}`;
          const bwd = `${members[j]}→${members[i]}`;
          const alreadyLinked = [...edgeSet].some(
            (k) => k.startsWith(fwd) || k.startsWith(bwd)
          );
          if (!alreadyLinked) {
            addEdge(members[i], members[j], "CATEGORY");
          }
        }
      }
    }

    // ── 更新节点 linkCount（纳入所有边，TAG_NODE 除外）──────────────────────
    const linkCountMap = new Map<string, number>();
    for (const edge of edges) {
      if (edge.type === "TAG_NODE") continue;
      linkCountMap.set(edge.source, (linkCountMap.get(edge.source) || 0) + 1);
      linkCountMap.set(edge.target, (linkCountMap.get(edge.target) || 0) + 1);
    }
    for (const node of nodes) {
      const extra = linkCountMap.get(node.id) || 0;
      if (node.nodeType !== "NOTE" && node.nodeType !== "BLOG") {
        node.linkCount = extra; // Project / TAG 节点的 linkCount 只计入动态边
      } else {
        node.linkCount += extra;
      }
    }

    return NextResponse.json({ nodes, edges });
  } catch (error) {
    console.error("Failed to fetch graph data:", error);
    return NextResponse.json({ error: "获取图谱数据失败" }, { status: 500 });
  }
}
