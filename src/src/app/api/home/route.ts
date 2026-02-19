import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [recentPosts, recentNotes, recentProjects] = await Promise.all([
      prisma.post.findMany({
        where: { type: "BLOG", published: true },
        orderBy: { publishedAt: "desc" },
        take: 5,
        select: {
          id: true,
          slug: true,
          title: true,
          titleEn: true,
          excerpt: true,
          excerptEn: true,
          coverImage: true,
          publishedAt: true,
          views: true,
        },
      }),
      prisma.post.findMany({
        where: { type: "NOTE", published: true },
        orderBy: { publishedAt: "desc" },
        take: 5,
        select: {
          id: true,
          slug: true,
          title: true,
          titleEn: true,
          category: true,
          publishedAt: true,
        },
      }),
      prisma.project.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        take: 6,
        select: {
          id: true,
          slug: true,
          title: true,
          titleEn: true,
          description: true,
          descriptionEn: true,
          coverImage: true,
          techStack: true,
        },
      }),
    ]);

    return NextResponse.json({
      data: {
        recentPosts,
        recentNotes,
        recentProjects,
      },
    });
  } catch (error) {
    console.error("Failed to fetch home data:", error);
    return NextResponse.json(
      { error: "获取首页数据失败" },
      { status: 500 }
    );
  }
}
