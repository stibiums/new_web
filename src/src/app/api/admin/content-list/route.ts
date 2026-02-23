import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface ContentListItem {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  nodeType: "BLOG" | "NOTE" | "PROJECT";
}

/**
 * GET /api/admin/content-list
 * 搜索所有已有内容（用于 Wiki 链接 Picker）
 *
 * 查询参数：
 *   q       - 关键词（模糊匹配 title / titleEn / slug）
 *   types   - 逗号分隔的类型列表，如 "BLOG,NOTE,PROJECT"（默认全部）
 *   limit   - 最多返回数量（默认 20）
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const typesParam = searchParams.get("types") || "BLOG,NOTE,PROJECT";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const allowedTypes = typesParam.split(",").map((t) => t.trim().toUpperCase());

  const results: ContentListItem[] = [];

  // 搜索 Post (BLOG + NOTE)
  if (allowedTypes.includes("BLOG") || allowedTypes.includes("NOTE")) {
    const postTypeFilter = ["BLOG", "NOTE"].filter((t) => allowedTypes.includes(t));
    const posts = await prisma.post.findMany({
      where: {
        type: { in: postTypeFilter as any },
        OR: q
          ? [
              { title: { contains: q } },
              { titleEn: { contains: q } },
              { slug: { contains: q } },
            ]
          : undefined,
      },
      select: { id: true, slug: true, title: true, titleEn: true, type: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    for (const p of posts) {
      results.push({
        id: p.id,
        slug: p.slug,
        title: p.title,
        titleEn: p.titleEn,
        nodeType: p.type as "BLOG" | "NOTE",
      });
    }
  }

  // 搜索 Project
  if (allowedTypes.includes("PROJECT")) {
    const projects = await prisma.project.findMany({
      where: {
        OR: q
          ? [
              { title: { contains: q } },
              { titleEn: { contains: q } },
              { slug: { contains: q } },
            ]
          : undefined,
      },
      select: { id: true, slug: true, title: true, titleEn: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    for (const p of projects) {
      results.push({
        id: p.id,
        slug: p.slug,
        title: p.title,
        titleEn: p.titleEn,
        nodeType: "PROJECT",
      });
    }
  }

  // 排序：按 title 匹配度（以 q 开头的排前面）
  if (q) {
    results.sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(q.toLowerCase()) ? 0 : 1;
      const bStarts = b.title.toLowerCase().startsWith(q.toLowerCase()) ? 0 : 1;
      return aStarts - bStarts;
    });
  }

  return NextResponse.json({ data: results.slice(0, limit) });
}
