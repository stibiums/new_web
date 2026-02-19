"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Download, Mail, Github, GraduationCap, Briefcase, Code } from "lucide-react";

export default function ResumePage() {
  const t = useTranslations("resume");
  const tHome = useTranslations("home");
  const params = useParams();
  const locale = params.locale as string;

  // Placeholder data - would come from a resume API or CMS in production
  const education = [
    {
      period: "2022 - 2025",
      degree: "M.S. in Computer Science",
      school: "University Name",
      location: "City, Country",
    },
    {
      period: "2018 - 2022",
      degree: "B.S. in Computer Science",
      school: "University Name",
      location: "City, Country",
    },
  ];

  const experience = [
    {
      period: "2023 - Present",
      role: "Research Assistant",
      company: "Lab Name",
      location: "City, Country",
      description: "Research description goes here.",
    },
    {
      period: "2021 - 2023",
      role: "Full Stack Developer",
      company: "Company Name",
      location: "City, Country",
      description: "Work description goes here.",
    },
  ];

  const skills = [
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Python",
    "PostgreSQL",
    "Docker",
    "AWS",
    "Git",
    "Linux",
  ];

  const contact = [
    { label: "Email", value: "contact@stibiums.top", href: "mailto:contact@stibiums.top" },
    { label: "GitHub", value: "github.com/stibiums", href: "https://github.com/stibiums" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold mb-2">{tHome("title")}</h1>
          <p className="text-muted-foreground">{tHome("subtitle")}</p>
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
          {contact.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              {item.label === "Email" ? (
                <Mail className="w-4 h-4" />
              ) : (
                <Github className="w-4 h-4" />
              )}
              {item.value}
            </a>
          ))}
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
