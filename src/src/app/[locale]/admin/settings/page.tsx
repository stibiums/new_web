"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { THEME_PRESETS } from "@/lib/themes";

interface SocialLink {
  platform: string;
  url: string;
  showOnHome: boolean;
}

interface Settings {
  site_title: string;
  site_title_en: string;
  site_description: string;
  site_description_en: string;
  site_logo: string;
  site_favicon: string;
  git_name: string;
  git_email: string;
  git_remote_url: string;
  social_links: string;
  google_analytics_id: string;
  custom_head: string;
  custom_footer: string;
  theme_color: string;
  home_welcome: string;
  home_welcome_en: string;
  footer_copyright: string;
  footer_copyright_en: string;
}

const defaultSettings: Settings = {
  site_title: "",
  site_title_en: "",
  site_description: "",
  site_description_en: "",
  site_logo: "",
  site_favicon: "",
  git_name: "",
  git_email: "",
  git_remote_url: "",
  social_links: "[]",
  google_analytics_id: "",
  custom_head: "",
  custom_footer: "",
  theme_color: "violet",
  home_welcome: "",
  home_welcome_en: "",
  footer_copyright: "",
  footer_copyright_en: "",
};

export default function SettingsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const socialLinks: SocialLink[] = (() => {
    try {
      return JSON.parse(settings.social_links || "[]");
    } catch (e) {
      return [];
    }
  })();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (res.ok) {
          setSettings({ ...defaultSettings, ...data.data });
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "设置已保存，页面即将刷新..." });
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "保存失败" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof Settings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: keyof Settings) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(key);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "img");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        handleChange(key, data.url);
        setMessage({ type: "success", text: "图片上传成功" });
      } else {
        setMessage({ type: "error", text: data.error || "上传失败" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "上传失败" });
    } finally {
      setUploading(null);
      // 清空 input，允许重复上传同一个文件
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">站点设置</h1>
          <p className="text-[var(--color-muted-foreground)] mt-2">
            配置网站的全局信息
          </p>
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-[var(--color-muted)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">站点设置</h1>
        <p className="text-[var(--color-muted-foreground)] mt-2">
          配置网站的全局信息
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-500/10 text-green-500"
              : "bg-red-500/10 text-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>网站的基本信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">网站标题 (中文)</label>
              <Input
                value={settings.site_title}
                onChange={(e) => handleChange("site_title", e.target.value)}
                placeholder="我的个人网站"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">网站标题 (English)</label>
              <Input
                value={settings.site_title_en}
                onChange={(e) => handleChange("site_title_en", e.target.value)}
                placeholder="My Personal Website"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">网站描述 (中文)</label>
              <Textarea
                value={settings.site_description}
                onChange={(e) => handleChange("site_description", e.target.value)}
                placeholder="个人学术网站"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">网站描述 (English)</label>
              <Textarea
                value={settings.site_description_en}
                onChange={(e) => handleChange("site_description_en", e.target.value)}
                placeholder="Personal Academic Website"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 外观设置 */}
      <Card>
        <CardHeader>
          <CardTitle>外观设置</CardTitle>
          <CardDescription>配置网站的主题颜色和图标</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">主题色预设</label>
            <div className="flex flex-wrap gap-4">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleChange("theme_color", preset.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    settings.theme_color === preset.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:bg-muted"
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full shadow-sm"
                    style={{ backgroundColor: preset.color }}
                  />
                  <span className="text-sm font-medium">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Logo URL</label>
              <div className="flex gap-2">
                <Input
                  value={settings.site_logo}
                  onChange={(e) => handleChange("site_logo", e.target.value)}
                  placeholder="/logo.svg"
                />
                <input
                  type="file"
                  id="logo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "site_logo")}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("logo-upload")?.click()}
                  disabled={uploading === "site_logo"}
                >
                  {uploading === "site_logo" ? "上传中..." : "上传"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Favicon URL</label>
              <div className="flex gap-2">
                <Input
                  value={settings.site_favicon}
                  onChange={(e) => handleChange("site_favicon", e.target.value)}
                  placeholder="/favicon.ico"
                />
                <input
                  type="file"
                  id="favicon-upload"
                  className="hidden"
                  accept="image/*,.ico"
                  onChange={(e) => handleFileUpload(e, "site_favicon")}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("favicon-upload")?.click()}
                  disabled={uploading === "site_favicon"}
                >
                  {uploading === "site_favicon" ? "上传中..." : "上传"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 内容设置 */}
      <Card>
        <CardHeader>
          <CardTitle>内容设置</CardTitle>
          <CardDescription>配置首页欢迎语和页脚信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">首页欢迎语 (中文)</label>
              <Textarea
                value={settings.home_welcome}
                onChange={(e) => handleChange("home_welcome", e.target.value)}
                placeholder="欢迎来到我的个人网站..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">首页欢迎语 (English)</label>
              <Textarea
                value={settings.home_welcome_en}
                onChange={(e) => handleChange("home_welcome_en", e.target.value)}
                placeholder="Welcome to my personal website..."
                rows={3}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">页脚版权信息 (中文)</label>
              <Input
                value={settings.footer_copyright}
                onChange={(e) => handleChange("footer_copyright", e.target.value)}
                placeholder="© 2026 Stibiums. All rights reserved."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">页脚版权信息 (English)</label>
              <Input
                value={settings.footer_copyright_en}
                onChange={(e) => handleChange("footer_copyright_en", e.target.value)}
                placeholder="© 2026 Stibiums. All rights reserved."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 社交链接 */}
      <Card>
        <CardHeader>
          <CardTitle>社交链接</CardTitle>
          <CardDescription>在网站底部显示的社交媒体链接</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 动态社交链接 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">自定义社交链接</h3>
              <Button
                variant="outline"
                onClick={() => {
                  const newLinks = [...socialLinks, { platform: "", url: "", showOnHome: true }];
                  handleChange("social_links", JSON.stringify(newLinks));
                }}
              >
                添加链接
              </Button>
            </div>
            
            {socialLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">平台名称</label>
                  <Input
                    value={link.platform}
                    onChange={(e) => {
                      const newLinks = [...socialLinks];
                      newLinks[index].platform = e.target.value;
                      handleChange("social_links", JSON.stringify(newLinks));
                    }}
                    placeholder="例如: GitHub"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">链接地址</label>
                  <Input
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...socialLinks];
                      newLinks[index].url = e.target.value;
                      handleChange("social_links", JSON.stringify(newLinks));
                    }}
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id={`showOnHome-${index}`}
                    checked={link.showOnHome}
                    onChange={(e) => {
                      const newLinks = [...socialLinks];
                      newLinks[index].showOnHome = e.target.checked;
                      handleChange("social_links", JSON.stringify(newLinks));
                    }}
                    className="w-4 h-4"
                  />
                  <label htmlFor={`showOnHome-${index}`} className="text-sm">
                    在首页显示
                  </label>
                </div>
                <Button
                  variant="destructive"
                  className="mt-6"
                  onClick={() => {
                    const newLinks = socialLinks.filter((_, i) => i !== index);
                    handleChange("social_links", JSON.stringify(newLinks));
                  }}
                >
                  删除
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Git 配置 */}
      <Card>
        <CardHeader>
          <CardTitle>Git 配置</CardTitle>
          <CardDescription>配置自动提交时使用的 Git 用户信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Git 用户名 (user.name)</label>
              <Input
                value={settings.git_name}
                onChange={(e) => handleChange("git_name", e.target.value)}
                placeholder="Stibiums"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Git 邮箱 (user.email)</label>
              <Input
                type="email"
                value={settings.git_email}
                onChange={(e) => handleChange("git_email", e.target.value)}
                placeholder="contact@stibiums.top"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Git 远程仓库地址 (Remote URL)</label>
            <Input
              value={settings.git_remote_url}
              onChange={(e) => handleChange("git_remote_url", e.target.value)}
              placeholder="https://github.com/username/repo.git"
            />
          </div>
        </CardContent>
      </Card>

      {/* 高级设置 */}
      <Card>
        <CardHeader>
          <CardTitle>高级设置</CardTitle>
          <CardDescription>高级配置选项</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Google Analytics ID</label>
            <Input
              value={settings.google_analytics_id}
              onChange={(e) => handleChange("google_analytics_id", e.target.value)}
              placeholder="G-XXXXXXXXXX"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">自定义 Head 代码</label>
            <Textarea
              value={settings.custom_head}
              onChange={(e) => handleChange("custom_head", e.target.value)}
              placeholder="<script>...</script>"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">自定义 Footer 代码</label>
            <Textarea
              value={settings.custom_footer}
              onChange={(e) => handleChange("custom_footer", e.target.value)}
              placeholder="<script>...</script>"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "保存设置"}
        </Button>
      </div>
    </div>
  );
}
