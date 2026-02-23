import { prisma } from './prisma';
import { readMarkdownFile, listMarkdownFiles, getPublishedAt, FrontMatter } from './markdown-file';
import { getCurrentCommit } from './git';

/**
 * 从 Markdown 正文中提取所有 [[slug]] Wiki 链接中的 slug 列表
 */
function extractWikiLinks(content: string): string[] {
  const matches = content.matchAll(/\[\[([^\]]+)\]\]/g);
  const slugs: string[] = [];
  for (const match of matches) {
    const slug = match[1].trim();
    if (slug) slugs.push(slug);
  }
  return [...new Set(slugs)]; // 去重
}

/**
 * 同步某篇文章/笔记的链接关系到 PostLink 表
 * 包括：WIKI_LINK（正文 [[slug]]）和 FRONT_MATTER（front matter links:）
 */
async function syncPostLinks(postId: string, content: string, frontMatterLinks: string[] = []) {
  // 1. 从正文提取 wiki 链接 slug
  const wikiSlugs = extractWikiLinks(content);

  // 2. 将 slug 转换为 Post.id 的映射（只处理已存在的数据库记录）
  const allSlugs = [...new Set([...wikiSlugs, ...frontMatterLinks])];
  if (allSlugs.length === 0) {
    // 清理所有旧的 WIKI_LINK / FRONT_MATTER 类型链接
    await prisma.postLink.deleteMany({
      where: {
        sourceId: postId,
        type: { in: ['WIKI_LINK', 'FRONT_MATTER'] as any },
      },
    });
    return;
  }

  const targetPosts = await prisma.post.findMany({
    where: { slug: { in: allSlugs } },
    select: { id: true, slug: true },
  });
  const slugToId = new Map(targetPosts.map((p) => [p.slug, p.id]));

  // 3. 构建期望的链接记录
  const wikiLinks = wikiSlugs
    .map((slug) => slugToId.get(slug))
    .filter((id): id is string => !!id && id !== postId)
    .map((targetId) => ({ sourceId: postId, targetId, type: 'WIKI_LINK' as const }));

  const fmLinks = frontMatterLinks
    .map((slug) => slugToId.get(slug))
    .filter((id): id is string => !!id && id !== postId)
    .map((targetId) => ({ sourceId: postId, targetId, type: 'FRONT_MATTER' as const }));

  const desiredLinks = [...wikiLinks, ...fmLinks];

  // 4. 删除已不存在的 WIKI_LINK / FRONT_MATTER 链接
  const desiredTargetIds = desiredLinks.map((l) => l.targetId);
  await prisma.postLink.deleteMany({
    where: {
      sourceId: postId,
      type: { in: ['WIKI_LINK', 'FRONT_MATTER'] as any },
      ...(desiredTargetIds.length > 0 ? { targetId: { notIn: desiredTargetIds } } : {}),
    },
  });

  // 5. Upsert 新的链接（忽略已存在的相同 sourceId+targetId 记录，避免类型冲突时强制更新）
  for (const link of desiredLinks) {
    await prisma.postLink.upsert({
      where: { sourceId_targetId: { sourceId: link.sourceId, targetId: link.targetId } },
      update: { type: link.type },
      create: link,
    });
  }
}

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

  // 确保 published 是布尔类型
  let publishedValue = frontMatter.published;
  if (typeof publishedValue === 'string') {
    publishedValue = publishedValue === 'true';
  }
  if (typeof publishedValue !== 'boolean') {
    publishedValue = false;
  }

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
    published: publishedValue,
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

    // 同步 Wiki 链接和 Front Matter 链接
    await syncPostLinks(post.id, content, frontMatter.links || []);

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

    // 同步 Wiki 链接和 Front Matter 链接
    await syncPostLinks(note.id, content, frontMatter.links || []);

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
