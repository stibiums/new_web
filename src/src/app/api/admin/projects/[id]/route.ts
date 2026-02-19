import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 获取单个项目
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json({ error: "Failed to get project" }, { status: 500 });
  }
}

// 更新项目
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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

    // Check if project exists
    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if slug is being changed and if it conflicts
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.project.findUnique({
        where: { slug },
      });
      if (slugExists) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        slug: slug || existing.slug,
        title: title || existing.title,
        titleEn: titleEn !== undefined ? titleEn : existing.titleEn,
        description: description !== undefined ? description : existing.description,
        descriptionEn: descriptionEn !== undefined ? descriptionEn : existing.descriptionEn,
        content: content !== undefined ? content : existing.content,
        contentEn: contentEn !== undefined ? contentEn : existing.contentEn,
        techStack: techStack !== undefined ? techStack : existing.techStack,
        githubUrl: githubUrl !== undefined ? githubUrl : existing.githubUrl,
        demoUrl: demoUrl !== undefined ? demoUrl : existing.demoUrl,
        coverImage: coverImage !== undefined ? coverImage : existing.coverImage,
        published: published !== undefined ? published : existing.published,
        sortOrder: sortOrder !== undefined ? sortOrder : existing.sortOrder,
      },
    });

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// 删除项目
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
