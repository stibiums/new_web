import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowRight, Github, Mail, ExternalLink, Calendar } from 'lucide-react';

export default function Home() {
  const t = useTranslations('home');
  const tNav = useTranslations('nav');

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

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
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
          {['TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'AWS'].map((skill) => (
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
            href="/blog"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {t('viewAll')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-4">
          {/* Placeholder posts - will be replaced with real data */}
          <article className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              <span>2024-01-15</span>
            </div>
            <Link href="/blog/sample-post">
              <h3 className="text-xl font-semibold mb-2 hover:text-primary transition-colors">
                示例文章标题
              </h3>
            </Link>
            <p className="text-muted-foreground line-clamp-2">
              这是一篇示例文章的摘要内容，将会从数据库中读取实际的文章内容进行展示。
            </p>
          </article>

          <article className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              <span>2024-01-10</span>
            </div>
            <Link href="/blog/another-post">
              <h3 className="text-xl font-semibold mb-2 hover:text-primary transition-colors">
                另一篇示例文章
              </h3>
            </Link>
            <p className="text-muted-foreground line-clamp-2">
              这里是另一篇示例文章的摘要内容，展示了文章列表的样式。
            </p>
          </article>
        </div>
      </section>

      {/* Latest Projects Section */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">{t('latestProjects')}</h2>
          <Link
            href="/projects"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {t('viewAll')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Placeholder projects */}
          <div className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
            <h3 className="text-lg font-semibold mb-2">项目名称</h3>
            <p className="text-muted-foreground text-sm mb-4">
              项目描述内容
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 rounded bg-muted text-xs">Next.js</span>
              <span className="px-2 py-1 rounded bg-muted text-xs">TypeScript</span>
            </div>
            <div className="flex gap-3">
              <a
                href="#"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="w-4 h-4" />
                Code
              </a>
              <a
                href="#"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Demo
              </a>
            </div>
          </div>

          <div className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
            <h3 className="text-lg font-semibold mb-2">另一个项目</h3>
            <p className="text-muted-foreground text-sm mb-4">
              另一个项目的描述内容
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 rounded bg-muted text-xs">React</span>
              <span className="px-2 py-1 rounded bg-muted text-xs">Node.js</span>
            </div>
            <div className="flex gap-3">
              <a
                href="#"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="w-4 h-4" />
                Code
              </a>
              <a
                href="#"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Demo
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
