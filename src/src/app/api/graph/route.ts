import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface GraphNode {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  type: string;
  category: string | null;
  linkCount: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

export async function GET() {
  try {
    // 获取所有已发布的笔记和博客作为节点
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        type: true,
        category: true,
        links: { select: { targetId: true } },
        backlinks: { select: { sourceId: true } },
      },
    });

    // 构建节点数组
    const nodes: GraphNode[] = posts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      titleEn: post.titleEn,
      type: post.type,
      category: post.category,
      linkCount: post.links.length + post.backlinks.length,
    }));

    // 获取所有链接关系作为边
    const links = await prisma.postLink.findMany({
      select: {
        sourceId: true,
        targetId: true,
      },
    });

    const edges: GraphEdge[] = links.map((link) => ({
      source: link.sourceId,
      target: link.targetId,
    }));

    return NextResponse.json({
      nodes,
      edges,
    });
  } catch (error) {
    console.error("Failed to fetch graph data:", error);
    return NextResponse.json(
      { error: "获取图谱数据失败" },
      { status: 500 }
    );
  }
}
