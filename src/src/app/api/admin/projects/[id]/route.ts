import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeMarkdownFile, deleteMarkdownFile, FrontMatter } from "@/lib/markdown-file";
import { autoCommit } from "@/lib/git";

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

// 更新项目 (文件 + 数据库 + Git 三写同步)
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
      linkType,
      detailType,
      externalUrl,
      htmlFilePath,
    } = body;

    // Check if project exists
    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 确定新的 slug
    const newSlug = slug || existing.slug;

    // Check if slug is being changed and if it conflicts
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.project.findUnique({
        where: { slug },
      });
      if (slugExists) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
      }

      // slug 变更：删除旧文件
      if (existing.filePath) {
        await deleteMarkdownFile("projects", existing.slug);
      }
    }

    // 1. 写入 Markdown 文件（如果有 content）
    const filePath = `content/projects/${newSlug}.md`;
    let gitCommit: string | null = existing.gitCommit;

    const newContent = content !== undefined ? content : existing.content;
    if (newContent) {
      const frontMatter: FrontMatter = {
        title: title || existing.title,
        titleEn: titleEn !== undefined ? titleEn : existing.titleEn || undefined,
        description: description !== undefined ? description : existing.description || undefined,
        descriptionEn: descriptionEn !== undefined ? descriptionEn : existing.descriptionEn || undefined,
        techStack: techStack !== undefined ? techStack : existing.techStack || undefined,
        githubUrl: githubUrl !== undefined ? githubUrl : existing.githubUrl || undefined,
        demoUrl: demoUrl !== undefined ? demoUrl : existing.demoUrl || undefined,
        coverImage: coverImage !== undefined ? coverImage : existing.coverImage || undefined,
        published: published !== undefined ? published : existing.published,
      };

      await writeMarkdownFile("projects", newSlug, frontMatter, newContent);

      // 2. Git 自动提交
      gitCommit = await autoCommit(filePath);
    }

    // 3. 更新数据库
    const project = await prisma.project.update({
      where: { id },
      data: {
        slug: newSlug,
        title: title || existing.title,
        titleEn: titleEn !== undefined ? titleEn : existing.titleEn,
        description: description !== undefined ? description : existing.description,
        descriptionEn: descriptionEn !== undefined ? descriptionEn : existing.descriptionEn,
        content: newContent,
        contentEn: contentEn !== undefined ? contentEn : existing.contentEn,
        techStack: techStack !== undefined ? techStack : existing.techStack,
        githubUrl: githubUrl !== undefined ? githubUrl : existing.githubUrl,
        demoUrl: demoUrl !== undefined ? demoUrl : existing.demoUrl,
        coverImage: coverImage !== undefined ? coverImage : existing.coverImage,
        published: published !== undefined ? published : existing.published,
        sortOrder: sortOrder !== undefined ? sortOrder : existing.sortOrder,
        filePath: newContent ? filePath : existing.filePath,
        gitCommit,
        linkType: linkType !== undefined ? linkType : existing.linkType,
        detailType: detailType !== undefined ? detailType : existing.detailType,
        externalUrl: externalUrl !== undefined ? externalUrl : existing.externalUrl,
        htmlFilePath: htmlFilePath !== undefined ? htmlFilePath : existing.htmlFilePath,
      },
    });

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// 删除项目 (文件 + 数据库 + Git 三写同步)
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

    // 1. 删除 Markdown 文件（如果存在）
    if (existing.filePath) {
      await deleteMarkdownFile("projects", existing.slug);

      // 2. Git 自动提交（删除文件）
      await autoCommit(existing.filePath);
    }

    // 3. 删除数据库记录
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
