import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { autoCommit } from "@/lib/git";

// 资源类型配置
const ASSET_TYPES = {
  img: {
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
    maxSize: 5 * 1024 * 1024, // 5MB
    subDir: "img",
  },
  pdf: {
    allowedTypes: ["application/pdf"],
    maxSize: 50 * 1024 * 1024, // 50MB
    subDir: "pdf",
  },
  video: {
    allowedTypes: ["video/mp4", "video/webm", "video/ogg"],
    maxSize: 100 * 1024 * 1024, // 100MB
    subDir: "video",
  },
  jupyter: {
    allowedTypes: ["application/json", "application/x-ipynb+json"],
    maxSize: 10 * 1024 * 1024, // 10MB
    subDir: "jupyter",
  },
} as const;

type AssetType = keyof typeof ASSET_TYPES;

function getAssetType(mimeType: string): AssetType | null {
  for (const [type, config] of Object.entries(ASSET_TYPES)) {
    if (config.allowedTypes.includes(mimeType)) {
      return type as AssetType;
    }
  }
  return null;
}

function getExtension(mimeType: string): string {
  const extMap: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "application/pdf": ".pdf",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/ogg": ".ogv",
    "application/json": ".json",
    "application/x-ipynb+json": ".ipynb",
  };
  return extMap[mimeType] || "";
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as AssetType | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 自动检测类型或使用指定的类型
    let assetType = type || getAssetType(file.type);

    // 如果无法自动检测且未指定类型，返回错误
    if (!assetType) {
      return NextResponse.json(
        { error: "不支持的文件类型" },
        { status: 400 }
      );
    }

    const config = ASSET_TYPES[assetType];

    // 验证文件类型
    if (!config.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `不支持的 ${assetType} 文件类型` },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > config.maxSize) {
      const maxMB = Math.round(config.maxSize / (1024 * 1024));
      return NextResponse.json(
        { error: `文件过大，最大支持 ${maxMB}MB` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 生成文件名（保持可读性）
    const ext = getExtension(file.type) || path.extname(file.name);
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "-");
    const filename = `${Date.now()}-${baseName}${ext}`;

    // 上传到对应目录
    const uploadDir = path.join(process.cwd(), "public", "assets", config.subDir);

    // 确保目录存在
    await mkdir(uploadDir, { recursive: true });

    // 写入文件
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // 返回 Markdown 可用的 URL
    const url = `/assets/${config.subDir}/${filename}`;

    // 自动 Git 提交
    try {
      const gitFilePath = `src/public/assets/${config.subDir}/${filename}`;
      await autoCommit(gitFilePath, `feat(asset): 上传 ${assetType} - ${filename}`);
    } catch (gitError) {
      console.error("Git auto commit failed:", gitError);
    }

    return NextResponse.json({
      url,
      type: assetType,
      filename,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
