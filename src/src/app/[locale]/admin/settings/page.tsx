"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

interface Settings {
  site_title: string;
  site_title_en: string;
  site_description: string;
  site_description_en: string;
  site_logo: string;
  site_favicon: string;
  github_url: string;
  twitter_url: string;
  email: string;
  google_analytics_id: string;
  custom_head: string;
  custom_footer: string;
}

const defaultSettings: Settings = {
  site_title: "",
  site_title_en: "",
  site_description: "",
  site_description_en: "",
  site_logo: "",
  site_favicon: "",
  github_url: "",
  twitter_url: "",
  email: "",
  google_analytics_id: "",
  custom_head: "",
  custom_footer: "",
};

export default function SettingsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
        setMessage({ type: "success", text: "设置已保存" });
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Logo URL</label>
              <Input
                value={settings.site_logo}
                onChange={(e) => handleChange("site_logo", e.target.value)}
                placeholder="/logo.svg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Favicon URL</label>
              <Input
                value={settings.site_favicon}
                onChange={(e) => handleChange("site_favicon", e.target.value)}
                placeholder="/favicon.ico"
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">GitHub</label>
              <Input
                value={settings.github_url}
                onChange={(e) => handleChange("github_url", e.target.value)}
                placeholder="https://github.com/username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Twitter / X</label>
              <Input
                value={settings.twitter_url}
                onChange={(e) => handleChange("twitter_url", e.target.value)}
                placeholder="https://x.com/username"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">邮箱</label>
            <Input
              type="email"
              value={settings.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="hello@example.com"
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
