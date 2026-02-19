import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const post = await prisma.post.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        content: true,
        contentEn: true,
        excerpt: true,
        excerptEn: true,
        coverImage: true,
        tags: true,
        category: true,
        published: true,
        publishedAt: true,
        views: true,
        likes: true,
        createdAt: true,
        updatedAt: true,
        links: {
          select: {
            target: {
              select: {
                id: true,
                slug: true,
                title: true,
                titleEn: true,
              },
            },
          },
        },
        backlinks: {
          select: {
            source: {
              select: {
                id: true,
                slug: true,
                title: true,
                titleEn: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error("Failed to fetch post:", error);
    return NextResponse.json(
      { error: "获取文章失败" },
      { status: 500 }
    );
  }
}
