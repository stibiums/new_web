import simpleGit, { SimpleGit } from 'simple-git';
import path from 'path';

// 项目根目录
// 开发时: new_web/src/ 目录（Next.js 工作目录）
// 内容目录: new_web/src/content/
// Git 仓库: new_web/ (开发仓库) 或独立的 content 仓库
// 部署时: 通过 GIT_CONTENT_ROOT 环境变量指定
const PROJECT_ROOT = process.env.GIT_CONTENT_ROOT || process.cwd();

console.log(`[Git] Initializing with PROJECT_ROOT: ${PROJECT_ROOT}`);

const git: SimpleGit = simpleGit({
  baseDir: PROJECT_ROOT,
  timeout: { block: 10000 }, // 10 秒超时，防止 push 等操作挂起
});

/**
 * 从 Markdown 内容中提取资源文件路径（/assets/... 引用）
 */
function extractAssetPaths(content: string): string[] {
  // 匹配 Markdown 和 HTML 中出现的 /assets/... 路径
  const regex = /\/assets\/[^\s"')>\]]+/g;
  const matches = content.match(regex) || [];
  return [...new Set(matches)];
}

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
 * gitRemove - 将已从磁盘删除的文件从 git 索引中移除（git rm --cached）
 * @param filePath - 文件路径
 */
export async function gitRemove(filePath: string): Promise<boolean> {
  try {
    await git.raw(['rm', '--cached', '--ignore-unmatch', '-f', filePath]);
    console.log(`[Git] Staged removal: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`[Git] Failed to remove from index: ${filePath}`, error);
    return false;
  }
}

/**
 * autoRemove - 自动提交文件删除（git rm --cached + commit + push）
 * 适用于文件已从磁盘删除的场景（如 deleteMarkdownFile 之后）
 */
export async function autoRemove(
  filePath: string,
  message?: string
): Promise<string | null> {
  const category = getFileCategory(filePath);
  const fileName = path.basename(filePath);
  const fileTypeLabel = getFileTypeLabel(category);
  const commitMessage = message || `feat(content): 删除 ${fileTypeLabel} - ${fileName}`;

  try {
    await gitRemove(filePath);

    const commitHash = await gitCommit(commitMessage);
    if (!commitHash) {
      console.error(`[Git] Nothing staged or commit failed for removal: ${filePath}`);
      return null;
    }

    gitPush().catch((err) => {
      console.warn(`[Git] Background push failed for removal: ${filePath}`, err);
    });

    console.log(`[Git] Successfully removed and committed: ${commitHash}`);
    return commitHash;
  } catch (error) {
    console.error(`[Git] Auto remove failed for: ${filePath}`, error);
    return null;
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
      const addResult = await git.add(filePath);
      console.log(`[Git] after await git.add(), result:`, addResult);
    }

    // 2. git commit
    const commitHash = await gitCommit(commitMessage);
    if (!commitHash) {
      console.error(`[Git] Failed to commit file: ${filePath}`);
      return null;
    }

    // 3. git push（后台执行，不阻塞 API 响应）
    gitPush().catch((err) => {
      console.warn(`[Git] Background push failed for: ${filePath}`, err);
    });

    console.log(`[Git] Successfully committed: ${commitHash} (push in background)`);
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
 * 获取文件原始历史（不经过线性时间轴过滤，内部使用）
 */
async function getRawFileHistory(
  filePath: string,
  limit = 10
): Promise<{ hash: string; date: string; message: string; author: string }[] | null> {
  try {
    const normalizedPath = filePath.startsWith('src/') ? filePath.slice(4) : filePath;
    const result = await git.log({ file: normalizedPath, maxCount: limit });
    if (!result.all || result.all.length === 0) return [];
    return result.all.map((c) => ({
      hash: c.hash,
      date: c.date,
      message: c.message,
      author: c.author_name,
    }));
  } catch (error) {
    console.error('[Git] Failed to get raw file history', error);
    return null;
  }
}

/**
 * 检查文件是否处于「刚刚回溯过」的状态
 * 若最近一次 commit 是 revert commit，则返回可撤销的目标 commit 信息
 */
export async function getUndoRevertInfo(filePath: string): Promise<
  | { canUndo: true; undoToHash: string; undoToMessage: string }
  | { canUndo: false }
> {
  const raw = await getRawFileHistory(filePath, 5);
  if (!raw || raw.length < 2) return { canUndo: false };

  const revertPattern = /^revert: 恢复 .+ 到版本 ([a-f0-9]{7})/;
  if (!revertPattern.test(raw[0].message)) return { canUndo: false };

  // index 1 = revert 之前的那个 commit，即撤销后应恢复到的版本
  return {
    canUndo: true,
    undoToHash: raw[1].hash,
    undoToMessage: raw[1].message,
  };
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
    // git show 中的路径必须相对于仓库根目录（不是 baseDir/CWD）
    // 通过 revparse 获取仓库根目录，计算正确的相对路径
    const repoRoot = (await git.revparse(['--show-toplevel'])).trim();
    // filePath 可能带有 src/ 前缀（如 src/content/notes/xxx.md）或不带（content/notes/xxx.md）
    // 先还原为相对于 PROJECT_ROOT 的路径（不带 src/），再拼成绝对路径再求相对于 repoRoot
    const normalizedToBase = filePath.startsWith('src/') ? filePath.slice(4) : filePath;
    const absolutePath = path.join(PROJECT_ROOT, normalizedToBase);
    const relToRoot = path.relative(repoRoot, absolutePath);

    const result = await git.show([`${commitHash}:${relToRoot}`]);
    return result;
  } catch (error) {
    console.error('[Git] Failed to get file at commit', error);
    return null;
  }
}

/**
 * 恢复到特定版本（同时恢复 Markdown 文件及其引用的资源文件）
 *
 * 改进点：
 * 1. 先获取目标 commit 的文件内容，从中提取资源路径
 * 2. 同时 checkout Markdown 文件和所有关联资源文件
 * 3. 合并为单个 git commit（不再产生双重提交）
 * 4. 返回 { newCommit, content } 供调用方同步数据库
 *
 * @param filePath - 文件路径（支持带 src/ 前缀）
 * @param commitHash - 目标 commit hash
 * @returns { newCommit: string; content: string } 或 null
 */
export async function revertToCommit(
  filePath: string,
  commitHash: string
): Promise<{ newCommit: string; content: string } | null> {
  try {
    // 规范化路径
    const normalizedPath = filePath.startsWith('src/') ? filePath.slice(4) : filePath;

    // 1. 先获取目标版本的 Markdown 内容，提取关联资源路径
    const historicalContent = await getFileAtCommit(filePath, commitHash);
    if (historicalContent === null) {
      console.error(`[Git] Cannot get content at commit ${commitHash} for: ${filePath}`);
      return null;
    }

    // 2. 恢复 Markdown 文件（git checkout <hash> -- <path>，自动 stage）
    await git.raw(['checkout', commitHash, '--', normalizedPath]);
    console.log(`[Git] Restored md: ${normalizedPath}`);

    // 3. 提取并尝试恢复关联资源文件（尽力恢复策略）
    const assetUrls = extractAssetPaths(historicalContent);
    const restoredAssets: string[] = [];

    for (const assetUrl of assetUrls) {
      // /assets/posts/slug/image.png → public/assets/posts/slug/image.png
      const assetRelPath = assetUrl.startsWith('/') ? `public${assetUrl}` : `public/${assetUrl}`;
      try {
        await git.raw(['checkout', commitHash, '--', assetRelPath]);
        restoredAssets.push(assetRelPath);
        console.log(`[Git] Restored asset: ${assetRelPath}`);
      } catch {
        // 目标 commit 中不存在该资源，跳过（不影响主流程）
        console.warn(`[Git] Asset not in commit ${commitHash.substring(0, 7)}, skipped: ${assetRelPath}`);
      }
    }

    if (restoredAssets.length > 0) {
      console.log(`[Git] Restored ${restoredAssets.length} asset(s) along with md file`);
    }

    // 4. 检查是否有实际变更被 staged（目标版本与当前内容完全相同时无需 commit）
    const status = await git.status();
    const hasStagedChanges = status.staged.length > 0;

    let finalCommit: string;

    if (!hasStagedChanges) {
      // 文件内容已与目标版本相同，无需产生新 commit
      // 返回当前 HEAD commit 作为标识
      const headCommit = await getCurrentCommit();
      finalCommit = headCommit ? headCommit.substring(0, 7) : commitHash.substring(0, 7);
      console.log(`[Git] No staged changes after checkout (already at target version), skipping commit`);
    } else {
      // 5. 一次性提交所有变更（合并为单个 commit）
      const fileName = path.basename(normalizedPath);
      const message = `revert: 恢复 ${fileName} 到版本 ${commitHash.substring(0, 7)}`;

      const newCommit = await gitCommit(message);
      if (!newCommit) {
        console.error(`[Git] Failed to commit revert of: ${normalizedPath}`);
        return null;
      }

      finalCommit = newCommit;

      // 后台 push，不阻塞响应
      gitPush().catch((err) => {
        console.warn(`[Git] Background push failed after revert`, err);
      });

      console.log(`[Git] Revert committed: ${finalCommit}`);
    }

    return { newCommit: finalCommit, content: historicalContent };
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
