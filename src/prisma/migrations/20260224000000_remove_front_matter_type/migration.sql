-- 删除所有 FRONT_MATTER 类型的链接（实际上不存在，防御性清理）
DELETE FROM `PostLink` WHERE `type` = 'FRONT_MATTER';

-- 将 PostLinkType 枚举修改为去除 FRONT_MATTER
ALTER TABLE `PostLink` MODIFY COLUMN `type` ENUM('EXPLICIT', 'WIKI_LINK') NOT NULL DEFAULT 'EXPLICIT';
