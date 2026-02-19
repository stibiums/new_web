import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stibiums.top";

    // Fetch published posts
    const posts = await prisma.post.findMany({
      where: {
        published: true,
        publishedAt: { not: null },
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
      select: {
        slug: true,
        title: true,
        titleEn: true,
        excerpt: true,
        excerptEn: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    // Build RSS 2.0 XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Stibiums Blog</title>
    <link>${siteUrl}</link>
    <description>Personal blog and notes</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/rss" rel="self" type="application/rss+xml"/>
    ${posts
      .map(
        (post) => `
    <item>
      <title><![CDATA[${post.titleEn || post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerptEn || post.excerpt || ""}]]></description>
      <pubDate>${post.publishedAt?.toUTCString() || ""}</pubDate>
      <updated>${post.updatedAt.toUTCString()}</updated>
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate",
      },
    });
  } catch (error) {
    console.error("Failed to generate RSS:", error);
    return NextResponse.json(
      { error: "Failed to generate RSS feed" },
      { status: 500 }
    );
  }
}
