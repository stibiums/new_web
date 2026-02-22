import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { autoCommit } from "@/lib/git";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename } = await params;
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get("contentType");
    const slug = searchParams.get("slug");

    if (!contentType || !slug) {
      return NextResponse.json(
        { error: "缺少 contentType 和 slug 参数" },
        { status: 400 }
      );
    }

    if (!filename) {
      return NextResponse.json(
        { error: "缺少文件名" },
        { status: 400 }
      );
    }

    // 安全检查：防止路径遍历
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(
      process.cwd(),
      "public",
      "assets",
      contentType,
      slug,
      sanitizedFilename
    );

    // 检查文件路径是否在允许范围内
    const allowedBase = path.join(process.cwd(), "public", "assets");
    if (!filePath.startsWith(allowedBase)) {
      return NextResponse.json(
        { error: "非法的文件路径" },
        { status: 400 }
      );
    }

    // 删除文件
    await unlink(filePath);

    // Git 自动提交
    try {
      const gitFilePath = `public/assets/${contentType}/${slug}/${sanitizedFilename}`;
      await autoCommit(gitFilePath, `chore(asset): 删除资源 - ${sanitizedFilename}`);
    } catch (gitError) {
      console.error("Git auto commit failed:", gitError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }
    console.error("Delete resource error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
