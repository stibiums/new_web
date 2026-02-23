import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const configs = await prisma.siteConfig.findMany({
      where: {
        NOT: {
          key: {
            startsWith: "git_",
          },
        },
      },
    });

    const settings: Record<string, string> = {};
    configs.forEach((config) => {
      settings[config.key] = config.value;
    });

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error("Failed to fetch config:", error);
    return NextResponse.json(
      { error: "获取配置失败" },
      { status: 500 }
    );
  }
}
