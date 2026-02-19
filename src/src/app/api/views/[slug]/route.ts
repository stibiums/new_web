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
      select: { views: true },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    return NextResponse.json({ data: { views: post.views } });
  } catch (error) {
    console.error("Failed to fetch views:", error);
    return NextResponse.json(
      { error: "获取浏览量失败" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 获取客户端 IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    // 查找或创建页面浏览记录
    const path = `/blog/${slug}`;

    // 简单起见，每小时同一 IP 只记录一次浏览
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const existingView = await prisma.pageView.findFirst({
      where: {
        path,
        ip,
        createdAt: { gt: oneHourAgo },
      },
    });

    if (!existingView) {
      // 记录浏览
      await prisma.pageView.create({
        data: {
          path,
          ip,
          userAgent: request.headers.get("user-agent") || undefined,
          referer: request.headers.get("referer") || undefined,
        },
      });

      // 增加文章浏览量
      await prisma.post.update({
        where: { slug },
        data: { views: { increment: 1 } },
      });
    }

    // 获取更新后的浏览量
    const post = await prisma.post.findUnique({
      where: { slug },
      select: { views: true },
    });

    return NextResponse.json({ data: { views: post?.views || 0 } });
  } catch (error) {
    console.error("Failed to record view:", error);
    return NextResponse.json(
      { error: "记录浏览量失败" },
      { status: 500 }
    );
  }
}
