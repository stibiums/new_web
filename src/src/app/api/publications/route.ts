import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const publications = await prisma.publication.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        authors: true,
        venue: true,
        year: true,
        doi: true,
        url: true,
        abstract: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: publications });
  } catch (error) {
    console.error("Failed to fetch publications:", error);
    return NextResponse.json(
      { error: "获取出版物列表失败" },
      { status: 500 }
    );
  }
}
