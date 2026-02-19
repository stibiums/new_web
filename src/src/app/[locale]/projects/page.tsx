"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Github, ExternalLink } from "lucide-react";

interface Project {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  coverImage: string | null;
  techStack: string | null;
  githubUrl: string | null;
  demoUrl: string | null;
}

export default function ProjectsPage() {
  const t = useTranslations("projects");
  const params = useParams();
  const locale = params.locale as string;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (res.ok) {
          setProjects(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getTitle = (project: Project) => {
    return locale === "en" && project.titleEn ? project.titleEn : project.title;
  };

  const getDescription = (project: Project) => {
    const desc = locale === "en" ? project.descriptionEn : project.description;
    return desc || "";
  };

  const getTechStack = (project: Project) => {
    if (!project.techStack) return [];
    return project.techStack.split(",").map((tech) => tech.trim());
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-6 rounded-lg border border-border">
              <div className="h-6 w-3/4 bg-muted rounded mb-4 animate-pulse" />
              <div className="h-4 w-full bg-muted rounded mb-2 animate-pulse" />
              <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      {projects.length === 0 ? (
        <p className="text-muted-foreground">{t("noResults")}</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors flex flex-col"
            >
              {/* Cover Image */}
              {project.coverImage && (
                <div className="mb-4 -mx-6 -mt-6 rounded-t-lg overflow-hidden">
                  <img
                    src={project.coverImage}
                    alt={getTitle(project)}
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              <h2 className="text-lg font-semibold mb-2">{getTitle(project)}</h2>

              {getDescription(project) && (
                <p className="text-muted-foreground text-sm mb-4 flex-1">
                  {getDescription(project)}
                </p>
              )}

              {getTechStack(project).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {getTechStack(project).map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 rounded bg-muted text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-border">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    {t("github")}
                  </a>
                )}
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t("demo")}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
