import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        description: true,
        descriptionEn: true,
        coverImage: true,
        techStack: true,
        githubUrl: true,
        demoUrl: true,
        linkType: true,
        detailType: true,
        externalUrl: true,
        htmlFilePath: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: projects });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "获取项目列表失败" },
      { status: 500 }
    );
  }
}
