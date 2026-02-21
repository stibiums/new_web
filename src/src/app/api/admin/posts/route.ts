import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeMarkdownFile, FrontMatter } from "@/lib/markdown-file";
import { autoCommit } from "@/lib/git";

// 获取文章列表
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const type = searchParams.get("type");
  const published = searchParams.get("published");
  const search = searchParams.get("search");

  const where: any = {};

  if (type) {
    where.type = type;
  }

  if (published !== null && published !== undefined) {
    where.published = published === "true";
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { titleEn: { contains: search } },
      { content: { contains: search } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({
    data: posts,
    total,
    page,
    limit,
  });
}

// 创建文章 (文件 + 数据库 + Git 三写同步)
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, title, titleEn, content, contentEn, excerpt, excerptEn, type, category, tags, coverImage, published } = body;

    // Validate required fields
    if (!slug || !title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if slug already exists in database
    const existing = await prisma.post.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    // 1. 写入 Markdown 文件
    const postType = type || "BLOG";
    const contentDir = postType === "NOTE" ? "notes" : "posts";
    const filePath = `content/${contentDir}/${slug}.md`;

    const frontMatter: FrontMatter = {
      title,
      titleEn: titleEn || undefined,
      excerpt: excerpt || undefined,
      excerptEn: excerptEn || undefined,
      category: category || undefined,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(",")) : undefined,
      coverImage: coverImage || undefined,
      published: published || false,
    };

    writeMarkdownFile(contentDir as "posts" | "notes" | "projects", slug, frontMatter, content);

    // 2. Git 自动提交
    const gitCommit = await autoCommit(filePath);

    // 3. 写入数据库
    const post = await prisma.post.create({
      data: {
        slug,
        title,
        titleEn: titleEn || null,
        content,
        contentEn: contentEn || null,
        excerpt: excerpt || null,
        excerptEn: excerptEn || null,
        type: postType,
        category: category || null,
        tags: tags ? (Array.isArray(tags) ? tags.join(",") : tags) : null,
        coverImage: coverImage || null,
        published: published || false,
        publishedAt: published ? new Date() : null,
        filePath,
        gitCommit,
      },
    });

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
