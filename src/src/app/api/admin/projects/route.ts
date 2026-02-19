import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取项目列表
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const published = searchParams.get("published");
  const search = searchParams.get("search");

  const where: any = {};

  if (published !== null && published !== undefined) {
    where.published = published === "true";
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { titleEn: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  return NextResponse.json({
    data: projects,
    total,
    page,
    limit,
  });
}

// 创建项目
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      slug,
      title,
      titleEn,
      description,
      descriptionEn,
      content,
      contentEn,
      techStack,
      githubUrl,
      demoUrl,
      coverImage,
      published,
      sortOrder,
    } = body;

    // Validate required fields
    if (!slug || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if slug already exists
    const existing = await prisma.project.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        slug,
        title,
        titleEn: titleEn || null,
        description: description || null,
        descriptionEn: descriptionEn || null,
        content: content || null,
        contentEn: contentEn || null,
        techStack: techStack || null,
        githubUrl: githubUrl || null,
        demoUrl: demoUrl || null,
        coverImage: coverImage || null,
        published: published || false,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
