"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Plus, Trash2, Save } from "lucide-react";

interface Education {
  period: string;
  degree: string;
  school: string;
  location: string;
}

interface Experience {
  period: string;
  role: string;
  company: string;
  location: string;
  description: string;
}

interface ResumeData {
  education: Education[];
  experience: Experience[];
  skills: string[];
}

const defaultResumeData: ResumeData = {
  education: [],
  experience: [],
  skills: [],
};

export default function ResumeAdminPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (res.ok && data.data.resume_data) {
          try {
            const parsed = JSON.parse(data.data.resume_data);
            setResumeData({ ...defaultResumeData, ...parsed });
          } catch (e) {
            console.error("Failed to parse resume data", e);
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume_data: JSON.stringify(resumeData),
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "简历数据保存成功" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "保存失败" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "保存失败，请重试" });
    } finally {
      setSaving(false);
    }
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const newEdu = [...resumeData.education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    setResumeData({ ...resumeData, education: newEdu });
  };

  const addEducation = () => {
    setResumeData({
      ...resumeData,
      education: [...resumeData.education, { period: "", degree: "", school: "", location: "" }],
    });
  };

  const removeEducation = (index: number) => {
    const newEdu = [...resumeData.education];
    newEdu.splice(index, 1);
    setResumeData({ ...resumeData, education: newEdu });
  };

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    const newExp = [...resumeData.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    setResumeData({ ...resumeData, experience: newExp });
  };

  const addExperience = () => {
    setResumeData({
      ...resumeData,
      experience: [...resumeData.experience, { period: "", role: "", company: "", location: "", description: "" }],
    });
  };

  const removeExperience = (index: number) => {
    const newExp = [...resumeData.experience];
    newExp.splice(index, 1);
    setResumeData({ ...resumeData, experience: newExp });
  };

  const updateSkills = (value: string) => {
    const skillsArray = value.split(",").map(s => s.trim()).filter(s => s);
    setResumeData({ ...resumeData, skills: skillsArray });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">简历管理</h1>
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? "保存中..." : "保存更改"}
        </Button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Education Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>教育经历 (Education)</CardTitle>
            <CardDescription>管理您的教育背景信息</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={addEducation} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> 添加
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {resumeData.education.map((edu, index) => (
            <div key={index} className="p-4 border rounded-lg relative space-y-4 bg-muted/20">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => removeEducation(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                <div className="space-y-2">
                  <label className="text-sm font-medium">时间段 (Period)</label>
                  <Input
                    value={edu.period}
                    onChange={(e) => updateEducation(index, "period", e.target.value)}
                    placeholder="e.g. 2022 - 2025"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">学位 (Degree)</label>
                  <Input
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                    placeholder="e.g. M.S. in Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">学校 (School)</label>
                  <Input
                    value={edu.school}
                    onChange={(e) => updateEducation(index, "school", e.target.value)}
                    placeholder="e.g. University Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">地点 (Location)</label>
                  <Input
                    value={edu.location}
                    onChange={(e) => updateEducation(index, "location", e.target.value)}
                    placeholder="e.g. City, Country"
                  />
                </div>
              </div>
            </div>
          ))}
          {resumeData.education.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              暂无教育经历，点击右上角添加
            </div>
          )}
        </CardContent>
      </Card>

      {/* Experience Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>工作经历 (Experience)</CardTitle>
            <CardDescription>管理您的工作或研究经历</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={addExperience} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> 添加
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {resumeData.experience.map((exp, index) => (
            <div key={index} className="p-4 border rounded-lg relative space-y-4 bg-muted/20">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => removeExperience(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                <div className="space-y-2">
                  <label className="text-sm font-medium">时间段 (Period)</label>
                  <Input
                    value={exp.period}
                    onChange={(e) => updateExperience(index, "period", e.target.value)}
                    placeholder="e.g. 2023 - Present"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">职位 (Role)</label>
                  <Input
                    value={exp.role}
                    onChange={(e) => updateExperience(index, "role", e.target.value)}
                    placeholder="e.g. Research Assistant"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">公司/组织 (Company)</label>
                  <Input
                    value={exp.company}
                    onChange={(e) => updateExperience(index, "company", e.target.value)}
                    placeholder="e.g. Lab Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">地点 (Location)</label>
                  <Input
                    value={exp.location}
                    onChange={(e) => updateExperience(index, "location", e.target.value)}
                    placeholder="e.g. City, Country"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">描述 (Description)</label>
                  <Textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(index, "description", e.target.value)}
                    placeholder="描述您的职责和成就..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ))}
          {resumeData.experience.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              暂无工作经历，点击右上角添加
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card>
        <CardHeader>
          <CardTitle>专业技能 (Skills)</CardTitle>
          <CardDescription>输入您的技能，使用英文逗号 (,) 分隔</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={resumeData.skills.join(", ")}
            onChange={(e) => updateSkills(e.target.value)}
            placeholder="e.g. TypeScript, React, Next.js, Node.js, Python"
            rows={3}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {resumeData.skills.map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
