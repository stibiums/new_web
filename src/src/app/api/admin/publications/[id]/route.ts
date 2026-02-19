import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 获取单个出版物
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const publication = await prisma.publication.findUnique({
      where: { id },
    });

    if (!publication) {
      return NextResponse.json(
        { error: "Publication not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: publication });
  } catch (error) {
    console.error("Get publication error:", error);
    return NextResponse.json(
      { error: "Failed to get publication" },
      { status: 500 }
    );
  }
}

// 更新出版物
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { title, authors, venue, year, doi, url, bibtex, abstract, sortOrder } = body;

    const existing = await prisma.publication.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Publication not found" },
        { status: 404 }
      );
    }

    const publication = await prisma.publication.update({
      where: { id },
      data: {
        title: title || existing.title,
        authors: authors || existing.authors,
        venue: venue !== undefined ? venue : existing.venue,
        year: year !== undefined ? (year ? parseInt(year) : null) : existing.year,
        doi: doi !== undefined ? doi : existing.doi,
        url: url !== undefined ? url : existing.url,
        bibtex: bibtex !== undefined ? bibtex : existing.bibtex,
        abstract: abstract !== undefined ? abstract : existing.abstract,
        sortOrder:
          sortOrder !== undefined ? parseInt(sortOrder) : existing.sortOrder,
      },
    });

    return NextResponse.json({ data: publication });
  } catch (error) {
    console.error("Update publication error:", error);
    return NextResponse.json(
      { error: "Failed to update publication" },
      { status: 500 }
    );
  }
}

// 删除出版物
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.publication.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Publication not found" },
        { status: 404 }
      );
    }

    await prisma.publication.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete publication error:", error);
    return NextResponse.json(
      { error: "Failed to delete publication" },
      { status: 500 }
    );
  }
}
