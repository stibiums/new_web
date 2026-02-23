import { getTranslations } from "next-intl/server";
import { Download, Mail, Github, GraduationCap, Briefcase, Code } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SocialIcon } from "@/components/ui/SocialIcon";

export default async function ResumePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("resume");
  const tHome = await getTranslations("home");

  // Fetch resume data from SiteConfig
  let resumeData = {
    education: [] as any[],
    experience: [] as any[],
    skills: [] as string[],
  };
  
  let siteConfig: Record<string, string> = {};

  try {
    const configs = await prisma.siteConfig.findMany();
    configs.forEach((c) => {
      siteConfig[c.key] = c.value;
    });

    if (siteConfig.resume_data) {
      resumeData = JSON.parse(siteConfig.resume_data);
    }
  } catch (error) {
    console.error("Failed to fetch resume data:", error);
  }

  const { education, experience, skills } = resumeData;

  // Parse social links for contact section
  let socialLinks: { platform: string; url: string; showOnHome: boolean }[] = [];
  try {
    if (siteConfig.social_links) {
      socialLinks = JSON.parse(siteConfig.social_links);
    }
  } catch (e) {
    console.error("Failed to parse social links", e);
  }

  const siteTitle = locale === "en" && siteConfig.site_title_en ? siteConfig.site_title_en : siteConfig.site_title;
  const siteSubtitle = locale === "en" && siteConfig.home_welcome_en ? siteConfig.home_welcome_en : siteConfig.home_welcome;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold mb-2">{siteTitle || tHome("title")}</h1>
          <p className="text-muted-foreground whitespace-pre-wrap">{siteSubtitle || tHome("subtitle")}</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors self-start">
          <Download className="w-4 h-4" />
          {t("download")}
        </button>
      </div>

      {/* Contact */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-border">
          {t("contact")}
        </h2>
        <div className="flex flex-wrap gap-6">
          {socialLinks.map((item, index) => (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <SocialIcon platform={item.platform} className="w-4 h-4" />
              {item.platform}
            </a>
          ))}
          {socialLinks.length === 0 && (
            <span className="text-muted-foreground text-sm">暂无联系方式</span>
          )}
        </div>
      </section>

      {/* Education */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-border flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          {t("education")}
        </h2>
        <div className="space-y-6">
          {education.map((edu, index) => (
            <div key={index} className="grid md:grid-cols-[1fr_2fr] gap-4">
              <div className="text-sm text-muted-foreground">{edu.period}</div>
              <div>
                <h3 className="font-medium">{edu.degree}</h3>
                <p className="text-sm text-muted-foreground">{edu.school}</p>
                <p className="text-sm text-muted-foreground">{edu.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Experience */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-border flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          {t("experience")}
        </h2>
        <div className="space-y-6">
          {experience.map((exp, index) => (
            <div key={index} className="grid md:grid-cols-[1fr_2fr] gap-4">
              <div className="text-sm text-muted-foreground">{exp.period}</div>
              <div>
                <h3 className="font-medium">{exp.role}</h3>
                <p className="text-sm text-muted-foreground">{exp.company}</p>
                <p className="text-sm text-muted-foreground">{exp.location}</p>
                <p className="text-sm mt-2">{exp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section>
        <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-border flex items-center gap-2">
          <Code className="w-5 h-5" />
          {t("skills")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 rounded-full bg-muted text-sm"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
