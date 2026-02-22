import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeMarkdownFile, deleteMarkdownFile, FrontMatter } from "@/lib/markdown-file";
import { autoCommit, autoRemove } from "@/lib/git";

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

// 更新文章 (文件 + 数据库 + Git 三写同步)
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

    // 确定新的 slug（用于文件操作）
    const newSlug = slug || existing.slug;
    const newType = type || existing.type;
    const contentDir = newType === "NOTE" ? "notes" : "posts";

    // Check if slug is being changed and if it conflicts
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.post.findUnique({
        where: { slug },
      });
      if (slugExists) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
      }

      // slug 变更：删除旧文件
      const oldContentDir = existing.type === "NOTE" ? "notes" : "posts";
      deleteMarkdownFile(oldContentDir as "posts" | "notes" | "projects", existing.slug);
    }

    // 1. 写入 Markdown 文件
    const filePath = `content/${contentDir}/${newSlug}.md`;

    const frontMatter: FrontMatter = {
      title: title || existing.title,
      titleEn: titleEn !== undefined ? titleEn : existing.titleEn || undefined,
      excerpt: excerpt !== undefined ? excerpt : existing.excerpt || undefined,
      excerptEn: excerptEn !== undefined ? excerptEn : existing.excerptEn || undefined,
      category: category !== undefined ? category : existing.category || undefined,
      tags: tags !== undefined ? (Array.isArray(tags) ? tags : tags.split(",")) : (existing.tags ? existing.tags.split(",") : undefined),
      coverImage: coverImage !== undefined ? coverImage : existing.coverImage || undefined,
      published: published !== undefined ? published : existing.published,
    };

    const newContent = content !== undefined ? content : existing.content;
    writeMarkdownFile(contentDir as "posts" | "notes" | "projects", newSlug, frontMatter, newContent);

    // 2. Git 自动提交
    const gitCommit = await autoCommit(filePath);

    // 3. 更新数据库
    const post = await prisma.post.update({
      where: { id },
      data: {
        slug: newSlug,
        title: title || existing.title,
        titleEn: titleEn !== undefined ? titleEn : existing.titleEn,
        content: newContent,
        contentEn: contentEn !== undefined ? contentEn : existing.contentEn,
        excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
        excerptEn: excerptEn !== undefined ? excerptEn : existing.excerptEn,
        type: newType,
        category: category !== undefined ? category : existing.category,
        tags: tags !== undefined ? (Array.isArray(tags) ? tags.join(",") : tags) : existing.tags,
        coverImage: coverImage !== undefined ? coverImage : existing.coverImage,
        published: published !== undefined ? published : existing.published,
        publishedAt: published && !existing.published ? new Date() : existing.publishedAt,
        filePath,
        gitCommit,
      },
    });

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

// 删除文章 (文件 + 数据库 + Git 三写同步)
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

    // 1. 删除 Markdown 文件（如果存在）
    const contentDir = existing.type === "NOTE" ? "notes" : "posts";
    deleteMarkdownFile(contentDir as "posts" | "notes" | "projects", existing.slug);

    // 2. Git 追踪删除（文件已从磁盘删除，用 autoRemove 代替 autoCommit）
    if (existing.filePath) {
      await autoRemove(existing.filePath);
    }

    // 3. 删除数据库记录
    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
