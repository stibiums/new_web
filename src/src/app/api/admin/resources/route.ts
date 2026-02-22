import { NextRequest, NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

// 根据文件扩展名推断资源类型
function getResourceType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const videoExts = [".mp4", ".webm", ".ogv", ".ogg"];
  const pdfExts = [".pdf"];
  const jupyterExts = [".ipynb"];

  if (imageExts.includes(ext)) return "image";
  if (videoExts.includes(ext)) return "video";
  if (pdfExts.includes(ext)) return "pdf";
  if (jupyterExts.includes(ext)) return "jupyter";
  return "other";
}

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get("contentType"); // posts | notes | projects
    const slug = searchParams.get("slug");
    const search = searchParams.get("search") || "";
    const filterType = searchParams.get("filterType") || ""; // image | video | pdf | jupyter

    if (!contentType || !slug) {
      return NextResponse.json(
        { error: "缺少 contentType 和 slug 参数" },
        { status: 400 }
      );
    }

    const resourceDir = path.join(
      process.cwd(),
      "public",
      "assets",
      contentType,
      slug
    );

    let files: {
      name: string;
      url: string;
      type: string;
      size: string;
      sizeBytes: number;
      createdAt: string;
    }[] = [];

    try {
      const entries = await readdir(resourceDir);

      for (const entry of entries) {
        const filePath = path.join(resourceDir, entry);
        const fileStat = await stat(filePath);

        if (!fileStat.isFile()) continue;

        const resourceType = getResourceType(entry);

        // 搜索过滤
        if (search && !entry.toLowerCase().includes(search.toLowerCase())) {
          continue;
        }

        // 类型过滤
        if (filterType && resourceType !== filterType) {
          continue;
        }

        files.push({
          name: entry,
          url: `/assets/${contentType}/${slug}/${entry}`,
          type: resourceType,
          size: formatSize(fileStat.size),
          sizeBytes: fileStat.size,
          createdAt: fileStat.birthtime.toISOString(),
        });
      }

      // 按创建时间倒序排列（最新的在前）
      files.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err: any) {
      // 目录不存在时返回空列表
      if (err.code !== "ENOENT") {
        throw err;
      }
    }

    return NextResponse.json({ data: files, total: files.length });
  } catch (error) {
    console.error("List resources error:", error);
    return NextResponse.json({ error: "获取资源列表失败" }, { status: 500 });
  }
}
