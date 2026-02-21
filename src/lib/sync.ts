import { prisma } from './prisma';
import { readMarkdownFile, listMarkdownFiles, getPublishedAt, FrontMatter } from './markdown-file';
import { getCurrentCommit } from './git';

/**
 * 同步文章到数据库
 */
export async function syncPostToDatabase(slug: string, commit = true): Promise<any | null> {
  const file = readMarkdownFile('posts', slug);

  if (!file) {
    console.error(`[Sync] Post not found: ${slug}`);
    return null;
  }

  const { frontMatter, content } = file;
  const publishedAt = getPublishedAt(frontMatter);

  // 构建数据对象
  const data: any = {
    slug,
    title: frontMatter.title || slug,
    titleEn: frontMatter.titleEn || null,
    content,
    contentEn: null, // TODO: 支持双语
    excerpt: frontMatter.excerpt || null,
    excerptEn: frontMatter.excerptEn || null,
    type: 'BLOG',
    category: frontMatter.category || null,
    tags: frontMatter.tags ? JSON.stringify(frontMatter.tags) : null,
    coverImage: frontMatter.coverImage || null,
    published: frontMatter.published || false,
    publishedAt: publishedAt,
    filePath: `content/posts/${slug}.md`,
  };

  // 获取当前 git commit
  if (commit) {
    const gitCommit = await getCurrentCommit();
    if (gitCommit) {
      data.gitCommit = gitCommit;
    }
  }

  try {
    // 使用 upsert 更新或创建记录
    const post = await prisma.post.upsert({
      where: { slug },
      update: data,
      create: data,
    });

    console.log(`[Sync] Post synced: ${slug}`);
    return post;
  } catch (error) {
    console.error(`[Sync] Failed to sync post: ${slug}`, error);
    return null;
  }
}

/**
 * 同步笔记到数据库
 */
export async function syncNoteToDatabase(slug: string, commit = true): Promise<any | null> {
  const file = readMarkdownFile('notes', slug);

  if (!file) {
    console.error(`[Sync] Note not found: ${slug}`);
    return null;
  }

  const { frontMatter, content } = file;
  const publishedAt = getPublishedAt(frontMatter);

  const data: any = {
    slug,
    title: frontMatter.title || slug,
    titleEn: frontMatter.titleEn || null,
    content,
    contentEn: null,
    excerpt: frontMatter.excerpt || null,
    excerptEn: frontMatter.excerptEn || null,
    type: 'NOTE',
    category: frontMatter.category || null,
    tags: frontMatter.tags ? JSON.stringify(frontMatter.tags) : null,
    coverImage: frontMatter.coverImage || null,
    published: frontMatter.published || false,
    publishedAt: publishedAt,
    filePath: `content/notes/${slug}.md`,
  };

  if (commit) {
    const gitCommit = await getCurrentCommit();
    if (gitCommit) {
      data.gitCommit = gitCommit;
    }
  }

  try {
    const note = await prisma.post.upsert({
      where: { slug },
      update: data,
      create: data,
    });

    console.log(`[Sync] Note synced: ${slug}`);
    return note;
  } catch (error) {
    console.error(`[Sync] Failed to sync note: ${slug}`, error);
    return null;
  }
}

/**
 * 同步项目到数据库
 */
export async function syncProjectToDatabase(slug: string, commit = true): Promise<any | null> {
  const file = readMarkdownFile('projects', slug);

  if (!file) {
    console.error(`[Sync] Project not found: ${slug}`);
    return null;
  }

  const { frontMatter, content } = file;

  // Project 模型字段映射
  const data: any = {
    slug,
    title: frontMatter.title || slug,
    titleEn: frontMatter.titleEn || null,
    description: frontMatter.excerpt || null,
    descriptionEn: frontMatter.excerptEn || null,
    content,
    contentEn: null,
    coverImage: frontMatter.coverImage || null,
    published: frontMatter.published || false,
    filePath: `content/projects/${slug}.md`,
  };

  if (commit) {
    const gitCommit = await getCurrentCommit();
    if (gitCommit) {
      data.gitCommit = gitCommit;
    }
  }

  try {
    const project = await prisma.project.upsert({
      where: { slug },
      update: data,
      create: data,
    });

    console.log(`[Sync] Project synced: ${slug}`);
    return project;
  } catch (error) {
    console.error(`[Sync] Failed to sync project: ${slug}`, error);
    return null;
  }
}

/**
 * 批量同步所有内容
 */
export async function syncAllContent(): Promise<{
  posts: number;
  notes: number;
  projects: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let posts = 0;
  let notes = 0;
  let projects = 0;

  // 同步文章
  const postSlugs = listMarkdownFiles('posts');
  for (const slug of postSlugs) {
    const result = await syncPostToDatabase(slug, false);
    if (result) {
      posts++;
    } else {
      errors.push(`Failed to sync post: ${slug}`);
    }
  }

  // 同步笔记
  const noteSlugs = listMarkdownFiles('notes');
  for (const slug of noteSlugs) {
    const result = await syncNoteToDatabase(slug, false);
    if (result) {
      notes++;
    } else {
      errors.push(`Failed to sync note: ${slug}`);
    }
  }

  // 同步项目
  const projectSlugs = listMarkdownFiles('projects');
  for (const slug of projectSlugs) {
    const result = await syncProjectToDatabase(slug, false);
    if (result) {
      projects++;
    } else {
      errors.push(`Failed to sync project: ${slug}`);
    }
  }

  console.log(`[Sync] All content synced: ${posts} posts, ${notes} notes, ${projects} projects`);

  return { posts, notes, projects, errors };
}
