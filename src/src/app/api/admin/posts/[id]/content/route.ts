import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readMarkdownFile } from "@/lib/markdown-file";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/posts/[id]/content
 * 获取文章的完整内容（包括从文件读取的 Markdown 内容）
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // 1. 获取文章元数据
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 2. 如果有 filePath，从文件系统读取内容
    let fileContent: string | undefined;
    let frontMatter: Record<string, unknown> | undefined;

    if (post.filePath) {
      // 从 filePath 解析 contentDir 和 slug
      // filePath 格式: content/posts/xxx.md 或 content/notes/xxx.md
      const match = post.filePath.match(/content\/(posts|notes|projects)\/(.+)\.md$/);
      if (match) {
        const [, contentDir, slug] = match;
        const fileData = readMarkdownFile(contentDir as "posts" | "notes" | "projects", slug);
        if (fileData) {
          fileContent = fileData.content;
          frontMatter = fileData.frontMatter;
        }
      }
    }

    // 3. 返回合并后的数据
    // 优先使用文件内容，如果没有则使用数据库内容
    return NextResponse.json({
      data: {
        ...post,
        content: fileContent || post.content,
        contentEn: fileContent ? post.contentEn : post.contentEn, // 英文内容暂不支持文件存储
        frontMatter,
      },
    });
  } catch (error) {
    console.error("Get post content error:", error);
    return NextResponse.json({ error: "Failed to get post content" }, { status: 500 });
  }
}
