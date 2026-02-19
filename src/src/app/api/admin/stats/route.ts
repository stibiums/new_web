import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 并行获取所有统计数据
    const [
      totalPosts,
      publishedPosts,
      totalNotes,
      publishedNotes,
      totalProjects,
      publishedProjects,
      totalPublications,
      totalViews,
      totalLikes,
      recentPosts,
      recentProjects,
    ] = await Promise.all([
      // 文章统计
      prisma.post.count({ where: { type: "BLOG" } }),
      prisma.post.count({ where: { type: "BLOG", published: true } }),

      // 笔记统计
      prisma.post.count({ where: { type: "NOTE" } }),
      prisma.post.count({ where: { type: "NOTE", published: true } }),

      // 项目统计
      prisma.project.count(),
      prisma.project.count({ where: { published: true } }),

      // 出版物统计
      prisma.publication.count(),

      // 浏览量和点赞
      prisma.post.aggregate({ _sum: { views: true } }),
      prisma.post.aggregate({ _sum: { likes: true } }),

      // 最近发布的文章
      prisma.post.findMany({
        where: { published: true },
        orderBy: { publishedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          titleEn: true,
          views: true,
          likes: true,
          publishedAt: true,
        },
      }),

      // 最近创建的项目
      prisma.project.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          titleEn: true,
          createdAt: true,
        },
      }),
    ]);

    // 获取今日浏览量
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayViews = await prisma.pageView.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    return NextResponse.json({
      data: {
        posts: {
          total: totalPosts,
          published: publishedPosts,
        },
        notes: {
          total: totalNotes,
          published: publishedNotes,
        },
        projects: {
          total: totalProjects,
          published: publishedProjects,
        },
        publications: {
          total: totalPublications,
        },
        views: {
          total: totalViews._sum.views || 0,
          today: todayViews,
        },
        likes: {
          total: totalLikes._sum.likes || 0,
        },
        recentPosts,
        recentProjects,
      },
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json(
      { error: "获取统计数据失败" },
      { status: 500 }
    );
  }
}
