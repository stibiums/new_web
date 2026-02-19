import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 获取出版物列表
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";

  try {
    const where = search
      ? {
          OR: [
            { title: { contains: search } },
            { authors: { contains: search } },
            { venue: { contains: search } },
          ],
        }
      : {};

    const [publications, total] = await Promise.all([
      prisma.publication.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.publication.count({ where }),
    ]);

    return NextResponse.json({
      data: publications,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Get publications error:", error);
    return NextResponse.json(
      { error: "Failed to get publications" },
      { status: 500 }
    );
  }
}

// 创建出版物
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, authors, venue, year, doi, url, bibtex, abstract, sortOrder } = body;

    if (!title || !authors) {
      return NextResponse.json(
        { error: "Title and authors are required" },
        { status: 400 }
      );
    }

    const publication = await prisma.publication.create({
      data: {
        title,
        authors,
        venue: venue || null,
        year: year ? parseInt(year) : null,
        doi: doi || null,
        url: url || null,
        bibtex: bibtex || null,
        abstract: abstract || null,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      },
    });

    return NextResponse.json({ data: publication }, { status: 201 });
  } catch (error) {
    console.error("Create publication error:", error);
    return NextResponse.json(
      { error: "Failed to create publication" },
      { status: 500 }
    );
  }
}
