import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const project = await prisma.project.findUnique({
      where: { slug },
    });

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    // 如果 detailType 是 EXTERNAL，重定向到外部链接
    if (project.detailType === "EXTERNAL" && project.externalUrl) {
      return NextResponse.redirect(project.externalUrl);
    }

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return NextResponse.json(
      { error: "获取项目失败" },
      { status: 500 }
    );
  }
}
