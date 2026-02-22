"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Github, Mail, ExternalLink, Calendar, Eye } from "lucide-react";

interface Post {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  excerpt: string | null;
  excerptEn: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  views: number;
}

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

export default function Home() {
  const t = useTranslations("home");
  const tNav = useTranslations("nav");
  const params = useParams();
  const locale = params.locale as string;
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [welcomeMsg, setWelcomeMsg] = useState("");

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await fetch("/api/home");
        const data = await res.json();
        if (res.ok) {
          setRecentPosts(data.data.recentPosts || []);
          setRecentProjects(data.data.recentProjects || []);
        }
        
        // Fetch welcome message from settings
        const settingsRes = await fetch("/api/admin/settings");
        const settingsData = await settingsRes.json();
        if (settingsRes.ok) {
          const msg = locale === "en" && settingsData.data.home_welcome_en 
            ? settingsData.data.home_welcome_en 
            : settingsData.data.home_welcome;
          setWelcomeMsg(msg || t('subtitle'));
        }
      } catch (error) {
        console.error("Failed to fetch home data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const getTitle = (item: Post | Project) => {
    return locale === "en" && "titleEn" in item && item.titleEn ? item.titleEn : item.title;
  };

  const getExcerpt = (item: Post) => {
    const excerpt = locale === "en" ? item.excerptEn : item.excerpt;
    return excerpt || "";
  };

  const getDescription = (item: Project) => {
    const desc = locale === "en" ? item.descriptionEn : item.description;
    return desc || "";
  };

  const getTechStack = (project: Project) => {
    if (!project.techStack) return [];
    return project.techStack.split(",").map((tech) => tech.trim());
  };

  // Skills - could also come from settings API in the future
  const skills = ['TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'AWS'];

  return (
    <div className="space-y-20 py-12">
      {/* Hero Section - 5.1 */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="text-center space-y-6">
          {/* Avatar placeholder */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-4xl font-bold text-white">
              S
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold">
            {t('title')}
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto whitespace-pre-wrap">
            {welcomeMsg || t('subtitle')}
          </p>

          {/* Social Links - 5.4 */}
          <div className="flex justify-center gap-4 pt-4">
            <a
              href="https://github.com/stibiums"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="mailto:contact@stibiums.top"
              className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com/stibiums"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Twitter"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Skills Section - 5.2 */}
      <section className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">{t('skills')}</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {skills.map((skill) => (
            <span
              key={skill}
              className="px-4 py-2 rounded-full bg-muted text-sm font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      {/* Latest Posts Section - 5.3 */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">{t('latestPosts')}</h2>
          <Link
            href={`/${locale}/blog`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {t('viewAll')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-6 rounded-lg border border-border">
                <div className="h-6 w-3/4 bg-muted rounded mb-4 animate-pulse" />
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : recentPosts.length === 0 ? (
          <p className="text-muted-foreground">暂无文章</p>
        ) : (
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <article
                key={post.id}
                className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  {post.publishedAt && (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                    </>
                  )}
                  {post.views > 0 && (
                    <>
                      <span className="mx-2">·</span>
                      <Eye className="w-4 h-4" />
                      <span>{post.views}</span>
                    </>
                  )}
                </div>
                <Link href={`/${locale}/blog/${post.slug}`}>
                  <h3 className="text-xl font-semibold mb-2 hover:text-primary transition-colors">
                    {getTitle(post)}
                  </h3>
                </Link>
                {getExcerpt(post) && (
                  <p className="text-muted-foreground line-clamp-2">
                    {getExcerpt(post)}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Latest Projects Section */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">{t('latestProjects')}</h2>
          <Link
            href={`/${locale}/projects`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {t('viewAll')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-6 rounded-lg border border-border">
                <div className="h-6 w-3/4 bg-muted rounded mb-4 animate-pulse" />
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : recentProjects.length === 0 ? (
          <p className="text-muted-foreground">暂无项目</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors flex flex-col"
              >
                <h3 className="text-lg font-semibold mb-2">{getTitle(project)}</h3>

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
                      Code
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
                      Demo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
