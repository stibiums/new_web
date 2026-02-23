import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 预定义的配置项
const ALLOWED_KEYS = [
  "site_title",
  "site_title_en",
  "site_description",
  "site_description_en",
  "site_logo",
  "site_favicon",
  "google_analytics_id",
  "custom_head",
  "custom_footer",
  "theme_color",
  "home_welcome",
  "home_welcome_en",
  "footer_copyright",
  "footer_copyright_en",
  "git_name",
  "git_email",
  "git_remote_url",
  "social_links",
  "resume_data",
];

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const configs = await prisma.siteConfig.findMany({
      orderBy: { key: "asc" },
    });

    // 转换为 key-value 对象
    const settings: Record<string, string> = {};
    configs.forEach((config) => {
      settings[config.key] = config.value;
    });

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { error: "获取设置失败" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "缺少 key 或 value" },
        { status: 400 }
      );
    }

    if (!ALLOWED_KEYS.includes(key)) {
      return NextResponse.json(
        { error: "无效的配置项" },
        { status: 400 }
      );
    }

    // upsert 操作
    const config = await prisma.siteConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json({ data: config });
  } catch (error) {
    console.error("Failed to update setting:", error);
    return NextResponse.json(
      { error: "更新设置失败" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "无效的设置数据" },
        { status: 400 }
      );
    }

    // 批量更新
    const updates = Object.entries(settings).map(([key, value]) => {
      if (!ALLOWED_KEYS.includes(key)) {
        return null;
      }
      return prisma.siteConfig.upsert({
        where: { key },
        update: { value: value as string },
        create: { key, value: value as string },
      });
    });

    await Promise.all(updates.filter(Boolean));

    // 返回更新后的所有设置
    const configs = await prisma.siteConfig.findMany({
      orderBy: { key: "asc" },
    });

    const result: Record<string, string> = {};
    configs.forEach((config) => {
      result[config.key] = config.value;
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "批量更新设置失败" },
      { status: 500 }
    );
  }
}
