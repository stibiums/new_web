import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 获取单个文章
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json({ error: "Failed to get post" }, { status: 500 });
  }
}

// 更新文章
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { slug, title, titleEn, content, contentEn, excerpt, excerptEn, type, category, tags, coverImage, published } = body;

    // Check if post exists
    const existing = await prisma.post.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if slug is being changed and if it conflicts
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.post.findUnique({
        where: { slug },
      });
      if (slugExists) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
      }
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        slug: slug || existing.slug,
        title: title || existing.title,
        titleEn: titleEn !== undefined ? titleEn : existing.titleEn,
        content: content || existing.content,
        contentEn: contentEn !== undefined ? contentEn : existing.contentEn,
        excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
        excerptEn: excerptEn !== undefined ? excerptEn : existing.excerptEn,
        type: type || existing.type,
        category: category !== undefined ? category : existing.category,
        tags: tags !== undefined ? tags : existing.tags,
        coverImage: coverImage !== undefined ? coverImage : existing.coverImage,
        published: published !== undefined ? published : existing.published,
        publishedAt: published && !existing.published ? new Date() : existing.publishedAt,
      },
    });

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

// 删除文章
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.post.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
