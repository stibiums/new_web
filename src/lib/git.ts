import simpleGit, { SimpleGit } from 'simple-git';
import path from 'path';

// 项目根目录
const PROJECT_ROOT = process.cwd();

const git: SimpleGit = simpleGit(PROJECT_ROOT);

/**
 * 获取文件分类
 */
function getFileCategory(filePath: string): 'post' | 'note' | 'project' | 'asset' | 'unknown' {
  if (filePath.startsWith('content/posts/')) return 'post';
  if (filePath.startsWith('content/notes/')) return 'note';
  if (filePath.startsWith('content/projects/')) return 'project';
  if (filePath.startsWith('public/assets/')) return 'asset';
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
    await git.add(filePath);
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
    // 1. git add
    const addResult = await git.add(filePath);
    if (!addResult) {
      console.error(`[Git] Failed to add file: ${filePath}`);
      return null;
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
