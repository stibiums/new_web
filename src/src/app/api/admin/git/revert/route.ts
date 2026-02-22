import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revertToCommit } from "@/lib/git";
import { parseFrontMatter } from "@/lib/markdown-file";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { filePath, commitHash } = body;

    if (!filePath || !commitHash) {
      return NextResponse.json(
        { error: "Missing filePath or commitHash" },
        { status: 400 }
      );
    }

    // 执行 git 回滚（同时恢复关联资源文件，合并为单个 commit）
    const result = await revertToCommit(filePath, commitHash);
    if (!result) {
      return NextResponse.json(
        { error: "Failed to revert to commit" },
        { status: 500 }
      );
    }

    const { newCommit, content: rawContent } = result;

    // 解析回滚后的 Front Matter，直接更新数据库（不依赖客户端再次触发保存）
    try {
      const { frontMatter, content } = parseFrontMatter(rawContent);

      // 用 filePath 查找对应数据库记录（DB 中存储的路径不含 src/ 前缀）
      const normalizedFilePath = filePath.startsWith("src/")
        ? filePath.slice(4)
        : filePath;

      const existing = await prisma.post.findFirst({
        where: { filePath: normalizedFilePath },
      });

      if (existing) {
        await prisma.post.update({
          where: { id: existing.id },
          data: {
            title: (frontMatter.title as string) || existing.title,
            titleEn: (frontMatter.titleEn as string | undefined) ?? existing.titleEn,
            content,
            excerpt: (frontMatter.excerpt as string | undefined) ?? existing.excerpt,
            excerptEn: (frontMatter.excerptEn as string | undefined) ?? existing.excerptEn,
            category: (frontMatter.category as string | undefined) ?? existing.category,
            tags: Array.isArray(frontMatter.tags)
              ? (frontMatter.tags as string[]).join(",")
              : typeof frontMatter.tags === "string"
              ? frontMatter.tags
              : existing.tags,
            coverImage: (frontMatter.coverImage as string | undefined) ?? existing.coverImage,
            gitCommit: newCommit,
          },
        });
        console.log(`[Revert] DB synced for post: ${existing.id}`);
      } else {
        console.warn(`[Revert] No DB record found for filePath: ${normalizedFilePath}`);
      }
    } catch (dbError) {
      // DB 同步失败不影响 git 回滚结果，记录警告即可
      console.error("[Revert] DB sync failed after revert:", dbError);
    }

    return NextResponse.json({
      success: true,
      newCommit,
      content: rawContent,
      message: `已恢复到版本 ${commitHash.substring(0, 7)}`,
    });
  } catch (error) {
    console.error("Git revert error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
