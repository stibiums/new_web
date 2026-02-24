import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/posts/[id]/links
 * 获取文章的所有 EXPLICIT 手工链接
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const links = await prisma.postLink.findMany({
      where: { sourceId: id, type: "EXPLICIT" },
      include: {
        target: {
          select: { id: true, slug: true, title: true, type: true },
        },
      },
    });
    return NextResponse.json({ data: links });
  } catch (error) {
    console.error("Get links error:", error);
    return NextResponse.json({ error: "Failed to get links" }, { status: 500 });
  }
}

/**
 * POST /api/admin/posts/[id]/links
 * 添加一条 EXPLICIT 手工链接
 * body: { targetSlug: string }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const { targetSlug } = await request.json();

    if (!targetSlug) {
      return NextResponse.json({ error: "targetSlug is required" }, { status: 400 });
    }

    const target = await prisma.post.findUnique({
      where: { slug: targetSlug },
      select: { id: true, slug: true, title: true, type: true },
    });

    if (!target) {
      return NextResponse.json({ error: `文章 "${targetSlug}" 不存在` }, { status: 404 });
    }

    if (target.id === id) {
      return NextResponse.json({ error: "不能链接到自身" }, { status: 400 });
    }

    const link = await prisma.postLink.upsert({
      where: { sourceId_targetId: { sourceId: id, targetId: target.id } },
      update: { type: "EXPLICIT" },
      create: { sourceId: id, targetId: target.id, type: "EXPLICIT" },
      include: {
        target: { select: { id: true, slug: true, title: true, type: true } },
      },
    });

    return NextResponse.json({ data: link });
  } catch (error) {
    console.error("Create link error:", error);
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/posts/[id]/links
 * 删除一条 EXPLICIT 手工链接
 * body: { targetId: string }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const { targetId } = await request.json();

    if (!targetId) {
      return NextResponse.json({ error: "targetId is required" }, { status: 400 });
    }

    await prisma.postLink.deleteMany({
      where: { sourceId: id, targetId, type: "EXPLICIT" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete link error:", error);
    return NextResponse.json({ error: "Failed to delete link" }, { status: 500 });
  }
}
