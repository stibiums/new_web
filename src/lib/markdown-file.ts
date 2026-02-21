import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// 内容根目录
const CONTENT_DIR = path.join(process.cwd(), 'content');

export interface FrontMatter {
  title?: string;
  titleEn?: string;
  excerpt?: string;
  excerptEn?: string;
  category?: string;
  tags?: string[];
  coverImage?: string;
  published?: boolean;
  publishedAt?: string;
  [key: string]: unknown;
}

export interface MarkdownFile {
  content: string;
  frontMatter: FrontMatter;
  raw: string;
}

/**
 * 解析 Front Matter
 */
export function parseFrontMatter(raw: string): { frontMatter: FrontMatter; content: string } {
  const { data, content } = matter(raw);
  return {
    frontMatter: data as FrontMatter,
    content,
  };
}

/**
 * 生成 Front Matter
 */
export function buildFrontMatter(frontMatter: FrontMatter, content: string): string {
  // 过滤掉 undefined 和 null 值
  const filteredData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(frontMatter)) {
    if (value !== undefined && value !== null) {
      filteredData[key] = value;
    }
  }

  return matter.stringify(content, filteredData);
}

/**
 * 获取文件完整路径
 */
function getFilePath(type: 'posts' | 'notes' | 'projects', slug: string): string {
  return path.join(CONTENT_DIR, type, `${slug}.md`);
}

/**
 * 检查文件是否存在
 */
export function fileExists(type: 'posts' | 'notes' | 'projects', slug: string): boolean {
  const filePath = getFilePath(type, slug);
  return fs.existsSync(filePath);
}

/**
 * 读取 Markdown 文件
 */
export function readMarkdownFile(type: 'posts' | 'notes' | 'projects', slug: string): MarkdownFile | null {
  const filePath = getFilePath(type, slug);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { frontMatter, content } = parseFrontMatter(raw);

  return {
    content,
    frontMatter,
    raw,
  };
}

/**
 * 写入 Markdown 文件
 */
export function writeMarkdownFile(
  type: 'posts' | 'notes' | 'projects',
  slug: string,
  frontMatter: FrontMatter,
  content: string
): boolean {
  const filePath = getFilePath(type, slug);
  const dir = path.dirname(filePath);

  // 确保目录存在
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const raw = buildFrontMatter(frontMatter, content);
  fs.writeFileSync(filePath, raw, 'utf-8');

  return true;
}

/**
 * 删除 Markdown 文件
 */
export function deleteMarkdownFile(type: 'posts' | 'notes' | 'projects', slug: string): boolean {
  const filePath = getFilePath(type, slug);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}

/**
 * 列出指定类型的所有 Markdown 文件
 */
export function listMarkdownFiles(type: 'posts' | 'notes' | 'projects'): string[] {
  const dir = path.join(CONTENT_DIR, type);

  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir);
  return files
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace(/\.md$/, ''));
}

/**
 * 从 Front Matter 中获取发布日期
 */
export function getPublishedAt(frontMatter: FrontMatter): Date | null {
  if (frontMatter.publishedAt) {
    return new Date(frontMatter.publishedAt);
  }
  if (frontMatter.published) {
    return new Date();
  }
  return null;
}
