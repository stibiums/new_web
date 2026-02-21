import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { randomUUID } from "crypto";
import { autoCommit } from "@/lib/git";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename (keep original name for readability)
    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '-');
    const filename = `${Date.now()}-${baseName}${ext}`;

    // Upload to public/assets/img/ (will be in Git version control)
    const uploadDir = path.join(process.cwd(), "public", "assets", "img");

    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Return the URL for Markdown
    const url = `/assets/img/${filename}`;

    // Auto commit to Git (optional - can be disabled if needed)
    try {
      const gitFilePath = `src/public/assets/img/${filename}`;
      await autoCommit(gitFilePath, `feat(asset): 上传图片 - ${filename}`);
    } catch (gitError) {
      console.error("Git auto commit failed:", gitError);
      // Don't fail the upload if git commit fails
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
