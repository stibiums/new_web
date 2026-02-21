import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFileHistory, getFileAtCommit, getFileDiff } from "@/lib/git";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("filePath");
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const commitHash = searchParams.get("commitHash");
    const compareFrom = searchParams.get("compareFrom");

    if (!filePath) {
      return NextResponse.json({ error: "Missing filePath" }, { status: 400 });
    }

    // 获取特定版本的内容
    if (commitHash) {
      const content = await getFileAtCommit(filePath, commitHash);
      if (content === null) {
        return NextResponse.json({ error: "Failed to get file content" }, { status: 500 });
      }
      return NextResponse.json({ content });
    }

    // 获取两个版本之间的差异
    if (compareFrom && searchParams.get("compareTo")) {
      const toCommit = searchParams.get("compareTo")!;
      const diff = await getFileDiff(filePath, compareFrom, toCommit);
      if (diff === null) {
        return NextResponse.json({ error: "Failed to get diff" }, { status: 500 });
      }
      return NextResponse.json({ diff });
    }

    // 获取历史记录
    const history = await getFileHistory(filePath, limit);
    if (history === null) {
      return NextResponse.json({ error: "Failed to get history" }, { status: 500 });
    }

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Git history error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
