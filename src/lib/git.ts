import simpleGit, { SimpleGit } from 'simple-git';
import path from 'path';

// 项目根目录
// 开发时: new_web/ 目录
// 部署时: 通过 GIT_CONTENT_ROOT 环境变量指定（通常是挂载的数据目录）
const PROJECT_ROOT = process.env.GIT_CONTENT_ROOT || path.resolve(process.cwd(), '..');

console.log(`[Git] Initializing with PROJECT_ROOT: ${PROJECT_ROOT}`);

const git: SimpleGit = simpleGit(PROJECT_ROOT);

/**
 * 获取文件分类
 * 支持带 src/ 前缀和不带前缀的路径
 */
function getFileCategory(filePath: string): 'post' | 'note' | 'project' | 'asset' | 'unknown' {
  // 移除 src/ 前缀（如果存在）
  const normalizedPath = filePath.startsWith('src/') ? filePath.slice(4) : filePath;

  if (normalizedPath.startsWith('content/posts/')) return 'post';
  if (normalizedPath.startsWith('content/notes/')) return 'note';
  if (normalizedPath.startsWith('content/projects/')) return 'project';
  if (normalizedPath.startsWith('public/assets/')) return 'asset';
  return 'unknown';
}

/**
 * 获取文件类型的中文描述
 */
function getFileTypeLabel(category: string): string {
  switch (category) {
    case 'post':
      return '文章';
    case 'note':
      return '笔记';
    case 'project':
      return '项目';
    case 'asset':
      return '资源';
    default:
      return '文件';
  }
}

/**
 * gitAdd - 执行 git add
 * @param filePath - 要添加的文件路径（可以是 Markdown 或资源文件）
 */
export async function gitAdd(filePath: string): Promise<boolean> {
  try {
    // 检查文件是否存在
    const fs = await import('fs');

    // PROJECT_ROOT 是 /media/stibiums/document/github/new_web/src
    // 文件路径应该是 content/posts/xxx.md
    const fullPath = path.join(PROJECT_ROOT, filePath);

    console.log(`[Git] PROJECT_ROOT: ${PROJECT_ROOT}`);
    console.log(`[Git] fullPath: ${fullPath}`);
    console.log(`[Git] exists: ${fs.existsSync(fullPath)}`);

    if (!fs.existsSync(fullPath)) {
      console.error(`[Git] File not found: ${fullPath}`);
      return false;
    }

    // 使用相对路径给 git add
    await git.add(filePath);
    console.log(`[Git] Added: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`[Git] Failed to add file: ${filePath}`, error);
    return false;
  }
}

/**
 * gitCommit - 执行 git commit
 * @param message - 提交信息
 */
export async function gitCommit(message: string): Promise<string | null> {
  try {
    const result = await git.commit(message);
    if (result.commit) {
      return result.commit.substring(0, 7);
    }
    return null;
  } catch (error) {
    console.error(`[Git] Failed to commit: ${message}`, error);
    return null;
  }
}

/**
 * gitPush - 执行 git push
 */
export async function gitPush(): Promise<boolean> {
  try {
    await git.push();
    return true;
  } catch (error) {
    console.error('[Git] Failed to push', error);
    return false;
  }
}

/**
 * gitPull - 执行 git pull
 */
export async function gitPull(): Promise<boolean> {
  try {
    await git.pull();
    return true;
  } catch (error) {
    console.error('[Git] Failed to pull', error);
    return false;
  }
}

/**
 * getCurrentCommit - 获取当前 commit hash
 */
export async function getCurrentCommit(): Promise<string | null> {
  try {
    const result = await git.log({ maxCount: 1 });
    if (result.latest) {
      return result.latest.hash;
    }
    return null;
  } catch (error) {
    console.error('[Git] Failed to get current commit', error);
    return null;
  }
}

/**
 * autoCommit - 自动提交（添加文件 + 提交 + 推送）
 * @param filePath - 要提交的文件路径（支持 Markdown 和资源文件）
 * @param message - 提交信息（可选，不提供则自动生成）
 *
 * 支持的文件类型：
 * - content/posts/*.md (博客文章)
 * - content/notes/*.md (学习笔记)
 * - content/projects/*.md (项目展示)
 * - public/assets/* (静态资源)
 *
 * @returns 提交 hash 或 null（失败时）
 */
export async function autoCommit(
  filePath: string,
  message?: string
): Promise<string | null> {
  // 识别文件类型
  const category = getFileCategory(filePath);
  const fileName = path.basename(filePath);
  const fileTypeLabel = getFileTypeLabel(category);

  // 生成默认提交信息
  const commitMessage =
    message ||
    `feat(content): 更新 ${fileTypeLabel} - ${fileName}`;

  try {
    // 1. git add - 使用完整路径
    const fullPath = path.join(PROJECT_ROOT, filePath);
    console.log(`[Git] autoCommit adding: ${fullPath}`);

    // 检查文件是否已经 staged（已跟踪的文件 add 会返回空结果）
    const status = await git.status();
    const isAlreadyStaged = status.staged.includes(filePath) ||
                           status.staged.some(f => f.endsWith(filePath.split('/').pop() || ''));

    if (isAlreadyStaged) {
      console.log(`[Git] File already staged, skipping add: ${filePath}`);
    } else {
      const addResult = await git.add(fullPath);
      console.log(`[Git] after await git.add(), result:`, addResult);
    }

    // 2. git commit
    const commitHash = await gitCommit(commitMessage);
    if (!commitHash) {
      console.error(`[Git] Failed to commit file: ${filePath}`);
      return null;
    }

    // 3. git push
    const pushResult = await gitPush();
    if (!pushResult) {
      console.warn(`[Git] Push failed, but commit succeeded: ${commitHash}`);
      // push 失败不返回 null，因为 commit 已经成功
    }

    console.log(`[Git] Successfully committed and pushed: ${commitHash}`);
    return commitHash;
  } catch (error) {
    console.error(`[Git] Auto commit failed for: ${filePath}`, error);
    return null;
  }
}

/**
 * 获取 git 状态
 */
export async function getStatus(): Promise<{
  modified: string[];
  staged: string[];
  untracked: string[];
} | null> {
  try {
    const status = await git.status();
    return {
      modified: status.modified,
      staged: status.staged,
      untracked: status.not_added,
    };
  } catch (error) {
    console.error('[Git] Failed to get status', error);
    return null;
  }
}

/**
 * 获取文件的历史提交记录
 * @param filePath - 文件路径（如 content/posts/xxx.md）
 * @param limit - 返回数量限制
 */
export async function getFileHistory(
  filePath: string,
  limit = 10
): Promise<{
  hash: string;
  date: string;
  message: string;
  author: string;
}[] | null> {
  try {
    // 规范化路径（移除 src/ 前缀）
    const normalizedPath = filePath.startsWith('src/') ? filePath.slice(4) : filePath;

    const result = await git.log({
      file: normalizedPath,
      maxCount: limit,
    });

    if (!result.all || result.all.length === 0) {
      return [];
    }

    return result.all.map((commit) => ({
      hash: commit.hash,
      date: commit.date,
      message: commit.message,
      author: commit.author_name,
    }));
  } catch (error) {
    console.error('[Git] Failed to get file history', error);
    return null;
  }
}

/**
 * 获取特定版本的的文件内容
 * @param filePath - 文件路径
 * @param commitHash - 提交 hash
 */
export async function getFileAtCommit(
  filePath: string,
  commitHash: string
): Promise<string | null> {
  try {
    // 规范化路径
    const normalizedPath = filePath.startsWith('src/') ? filePath.slice(4) : filePath;

    const result = await git.show([`${commitHash}:${normalizedPath}`]);
    return result;
  } catch (error) {
    console.error('[Git] Failed to get file at commit', error);
    return null;
  }
}

/**
 * 恢复到特定版本
 * @param filePath - 文件路径
 * @param commitHash - 提交 hash
 * @returns 新的 commit hash 或 null
 */
export async function revertToCommit(
  filePath: string,
  commitHash: string
): Promise<string | null> {
  try {
    // 规范化路径
    const normalizedPath = filePath.startsWith('src/') ? filePath.slice(4) : filePath;

    // 使用 git checkout 恢复到特定版本
    await git.checkout(commitHash, { '--': null, filePath: normalizedPath });

    // 自动提交恢复
    const fileName = path.basename(normalizedPath);
    const message = `revert: 恢复到 ${fileName} 版本 ${commitHash.substring(0, 7)}`;

    const newCommit = await gitCommit(message);
    if (newCommit) {
      // push 到远程
      await gitPush();
    }

    return newCommit;
  } catch (error) {
    console.error('[Git] Failed to revert to commit', error);
    return null;
  }
}

/**
 * 获取两个版本之间的差异
 * @param filePath - 文件路径
 * @param fromCommit - 起始 commit
 * @param toCommit - 结束 commit
 */
export async function getFileDiff(
  filePath: string,
  fromCommit: string,
  toCommit: string
): Promise<string | null> {
  try {
    // 规范化路径
    const normalizedPath = filePath.startsWith('src/') ? filePath.slice(4) : filePath;

    const diff = await git.diff([`${fromCommit}..${toCommit}`, '--', normalizedPath]);
    return diff;
  } catch (error) {
    console.error('[Git] Failed to get file diff', error);
    return null;
  }
}
