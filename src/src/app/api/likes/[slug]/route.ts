import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 获取客户端 IP，用于返回当前访客是否已点赞
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    const post = await prisma.post.findUnique({
      where: { slug },
      select: { id: true, likes: true },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const existingReaction = await prisma.reaction.findUnique({
      where: { postId_ip_type: { postId: post.id, ip, type: "like" } },
    });

    return NextResponse.json({ data: { likes: post.likes, liked: !!existingReaction } });
  } catch (error) {
    console.error("Failed to fetch likes:", error);
    return NextResponse.json(
      { error: "获取点赞数失败" },
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
    const { action } = await request.json();

    // 获取客户端 IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    const post = await prisma.post.findUnique({
      where: { slug },
      select: { id: true, likes: true },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    // 检查是否已经点赞
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        postId_ip_type: {
          postId: post.id,
          ip,
          type: "like",
        },
      },
    });

    let liked = false;

    if (action === "like") {
      if (!existingReaction) {
        // 添加点赞
        await prisma.reaction.create({
          data: {
            postId: post.id,
            ip,
            type: "like",
          },
        });
        await prisma.post.update({
          where: { slug },
          data: { likes: { increment: 1 } },
        });
        liked = true;
      }
    } else if (action === "unlike") {
      if (existingReaction) {
        // 取消点赞
        await prisma.reaction.delete({
          where: { id: existingReaction.id },
        });
        await prisma.post.update({
          where: { slug },
          data: { likes: { decrement: 1 } },
        });
      }
    }

    // 获取更新后的点赞数
    const updatedPost = await prisma.post.findUnique({
      where: { slug },
      select: { likes: true },
    });

    return NextResponse.json({
      data: {
        likes: updatedPost?.likes || 0,
        liked,
      },
    });
  } catch (error) {
    console.error("Failed to handle like:", error);
    return NextResponse.json(
      { error: "操作失败" },
      { status: 500 }
    );
  }
}
