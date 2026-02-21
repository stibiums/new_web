import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revertToCommit } from "@/lib/git";

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

    const newCommit = await revertToCommit(filePath, commitHash);
    if (!newCommit) {
      return NextResponse.json(
        { error: "Failed to revert to commit" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      newCommit,
      message: `已恢复到版本 ${commitHash.substring(0, 7)}`,
    });
  } catch (error) {
    console.error("Git revert error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
