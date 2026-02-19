import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "BLOG";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const published = searchParams.get("published");

    const where: any = {
      type,
    };

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by tag
    if (tag) {
      where.tags = {
        contains: tag,
      };
    }

    // Filter by published status (default to published only)
    if (published !== null && published !== undefined) {
      where.published = published === "true";
    } else {
      where.published = true;
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          titleEn: true,
          excerpt: true,
          excerptEn: true,
          coverImage: true,
          tags: true,
          category: true,
          publishedAt: true,
          views: true,
          likes: true,
          createdAt: true,
        },
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      data: posts,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { error: "获取文章列表失败" },
      { status: 500 }
    );
  }
}
