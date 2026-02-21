"use client";

import { useState, useCallback, useEffect } from "react";
import { MonacoMarkdownEditor } from "@/components/editor";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

const STORAGE_KEY = "monaco-test-content";

const TEST_CONTENT = `---
title: 测试文章
titleEn: Test Article
excerpt: 这是一篇测试文章
category: 测试
tags:
  - 测试
  - Monaco
published: true
---

# Hello World

这是一篇 **测试文章**，用于验证 Monaco Editor 组件。

## 功能测试

- [x] 基础渲染
- [x] 语法高亮
- [x] Ctrl+S 保存
- [x] 自动保存
- [x] 图片上传
- [x] 历史版本

## 代码示例

\`\`\`typescript
function hello() {
  console.log("Hello Monaco!");
}
\`\`\`

## 列表测试

1. 第一项
2. 第二项
3. 第三项

> 这是一个引用块

---

继续编辑...
`;

export default function TestEditorPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [currentCommit, setCurrentCommit] = useState<string>("");

  // 加载保存的内容
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setContent(saved);
    } else {
      setContent(TEST_CONTENT);
    }
    setLoading(false);
  }, []);

  // 简单的 Front Matter 解析函数
  const parseFrontMatter = (content: string): Record<string, any> => {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};

    const fm: Record<string, any> = {};
    const lines = match[1].split("\n");
    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        if (value.startsWith("[") && value.endsWith("]")) {
          const arrContent = value.slice(1, -1);
          fm[key] = arrContent ? arrContent.split(",").map((v) => v.trim()) : [];
        } else {
          fm[key] = value;
        }
      }
    }
    return fm;
  };

  // 保存内容到文件 + 数据库 + Git
  const handleSave = useCallback(async (value: string) => {
    try {
      // 解析 Front Matter
      const frontMatter = parseFrontMatter(value);

      // 调用 API 保存到文件
      const res = await fetch("/api/admin/save-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "test-editor",
          content: value,
          frontMatter,
          autoSync: true,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setSaveStatus(new Date().toLocaleTimeString());
        setCurrentCommit(result.gitCommit || "");
        toast.success(
          `保存成功! Git: ${result.gitCommit?.substring(0, 7) || "未提交"}`
        );
        console.log("Saved to file:", result);
      } else {
        toast.error("保存失败: " + result.error);
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败");
    }
  }, []);

  // 内容变化时更新状态
  const handleChange = useCallback((value: string) => {
    setContent(value);
    localStorage.setItem(STORAGE_KEY, value);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Monaco Editor 测试</h1>
          <div className="flex items-center gap-4">
            {saveStatus && (
              <span className="text-sm text-green-500">
                最后保存: {saveStatus}
              </span>
            )}
            <Button
              variant="outline"
              onClick={() => {
                const newContent = content + "\n\n## 新增内容\n测试...";
                setContent(newContent);
                toast.info("添加了测试内容");
              }}
            >
              添加内容
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm("确定要重置为初始内容吗？")) {
                  localStorage.removeItem(STORAGE_KEY);
                  setContent(TEST_CONTENT);
                  setSaveStatus("");
                  toast.info("已重置为初始内容");
                }
              }}
            >
              重置
            </Button>
            <Button
              onClick={() => {
                console.log("当前内容:", content);
                toast.info("内容已输出到控制台");
              }}
            >
              打印内容
            </Button>
          </div>
        </div>

        <div className="text-sm text-[var(--color-muted-foreground)]">
          <p>
            <strong>测试指南:</strong>
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>按 <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+S</kbd> 或 <kbd className="px-1 py-0.5 bg-muted rounded">Cmd+S</kbd> 手动保存</li>
            <li>等待 30 秒自动保存触发</li>
            <li>点击工具栏按钮上传图片/PDF/视频/Notebook</li>
            <li>点击"历史"按钮查看 Git 版本历史</li>
            <li>尝试拖拽图片到编辑器中上传</li>
          </ul>
        </div>

        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          <MonacoMarkdownEditor
            value={content}
            onChange={handleChange}
            onSave={handleSave}
            autoSaveInterval={30000}
            minHeight="600px"
            filePath="content/posts/test-editor.md"
            currentCommit={currentCommit}
          />
        </div>

        {/* 实时内容显示 */}
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">实时内容预览:</div>
          <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-64 font-mono">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
}
