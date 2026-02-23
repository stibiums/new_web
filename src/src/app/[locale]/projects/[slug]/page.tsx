"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Github, ExternalLink } from "lucide-react";
import { MarkdownRenderer } from "@/components/content";

interface Project {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  content: string | null;
  contentEn: string | null;
  coverImage: string | null;
  techStack: string | null;
  githubUrl: string | null;
  demoUrl: string | null;
  linkType: "DETAIL" | "GITHUB" | "DEMO" | "EXTERNAL";
  detailType: "MARKDOWN" | "HTML" | "EXTERNAL";
  externalUrl: string | null;
  htmlFilePath: string | null;
}

export default function ProjectDetailPage() {
  const t = useTranslations("projects");
  const params = useParams();
  const locale = params.locale as string;
  const slug = params.slug as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${slug}`);
        const data = await res.json();
        if (res.ok) {
          setProject(data.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to fetch project:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [slug]);

  const getTitle = (p: Project) => {
    return locale === "en" && p.titleEn ? p.titleEn : p.title;
  };

  const getDescription = (p: Project) => {
    const desc = locale === "en" ? p.descriptionEn : p.description;
    return desc || "";
  };

  const getContent = (p: Project) => {
    return locale === "en" && p.contentEn ? p.contentEn : p.content;
  };

  const getTechStack = (p: Project) => {
    if (!p.techStack) return [];
    return p.techStack.split(",").map((tech) => tech.trim());
  };

  // 如果是 HTML 类型，直接渲染 iframe
  if (project?.detailType === "HTML" && project.htmlFilePath) {
    return (
      <div className="h-screen flex flex-col">
        {/* 顶部导航栏 */}
        <div className="shrink-0 border-b border-border bg-background px-4 py-2 flex items-center justify-between">
          <Link
            href={`/${locale}/projects`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            返回项目列表
          </Link>
          <div className="flex items-center gap-2">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
        {/* HTML iframe */}
        <iframe
          src={project.htmlFilePath}
          className="flex-1 w-full border-0"
          title={getTitle(project)}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href={`/${locale}/projects`}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          返回项目列表
        </Link>
        <div className="space-y-4">
          <div className="h-10 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-96 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">项目不存在</h1>
        <Link href={`/${locale}/projects`} className="text-primary hover:underline">
          返回项目列表
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Back link */}
      <Link
        href={`/${locale}/projects`}
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        返回项目列表
      </Link>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{getTitle(project)}</h1>

        {getDescription(project) && (
          <p className="text-muted-foreground text-lg mb-4">{getDescription(project)}</p>
        )}

        {getTechStack(project).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {getTechStack(project).map((tech) => (
              <span key={tech} className="px-3 py-1 rounded-full bg-muted text-sm">
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Links */}
        <div className="flex gap-4">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <Github className="w-5 h-5" />
              GitHub
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              Demo
            </a>
          )}
        </div>
      </header>

      {/* Cover Image */}
      {project.coverImage && (
        <div className="mb-8 rounded-lg overflow-hidden">
          <img
            src={project.coverImage}
            alt={getTitle(project)}
            className="w-full h-auto"
          />
        </div>
      )}

      {/* Content */}
      {getContent(project) && <MarkdownRenderer content={getContent(project) || ""} />}
    </div>
  );
}
