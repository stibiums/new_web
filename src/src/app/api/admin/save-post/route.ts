import { NextRequest, NextResponse } from "next/server";
import { writeMarkdownFile, FrontMatter } from "@/lib/markdown-file";
import { syncPostToDatabase } from "@/lib/sync";
import { autoCommit } from "@/lib/git";
import path from "path";

// 保存文章内容
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, content, frontMatter, autoSync = true } = body;

    if (!slug || !content) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 1. 写入 Markdown 文件
    const fm: FrontMatter = frontMatter || {
      title: slug,
      published: true,
    };

    const success = writeMarkdownFile("posts", slug, fm, content);

    if (!success) {
      return NextResponse.json(
        { error: "写入文件失败" },
        { status: 500 }
      );
    }

    // 2. 可选：同步到数据库
    let dbResult = null;
    if (autoSync) {
      dbResult = await syncPostToDatabase(slug, false);
    }

    // 3. 可选：Git 提交
    let gitCommit = null;
    if (autoSync) {
      try {
        // Git 仓库在根目录 new_web/，文件在 src/content/
        const filePath = `src/content/posts/${slug}.md`;
        gitCommit = await autoCommit(filePath);
      } catch (gitError) {
        console.error("Git auto commit failed:", gitError);
      }
    }

    return NextResponse.json({
      success: true,
      filePath: `content/posts/${slug}.md`,
      database: dbResult ? "synced" : "skipped",
      gitCommit,
    });
  } catch (error) {
    console.error("保存文章失败:", error);
    return NextResponse.json(
      { error: "保存失败" },
      { status: 500 }
    );
  }
}
