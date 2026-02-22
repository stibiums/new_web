export type ThemeColor = "violet" | "slate-blue" | "emerald" | "rose" | "zinc";

export interface ThemePreset {
  id: ThemeColor;
  name: string;
  color: string; // 用于在设置页面显示预览圆点
  cssVars: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "violet",
    name: "紫罗兰 (Violet)",
    color: "#7C3AED",
    cssVars: {
      light: {
        "--primary": "#7C3AED",
        "--primary-hover": "#6D28D9",
        "--secondary": "#8B5CF6",
        "--muted": "#F5F3FF",
      },
      dark: {
        "--primary": "#8B5CF6",
        "--primary-hover": "#A78BFA",
        "--secondary": "#7C3AED",
        "--muted": "#1E1E35",
      },
    },
  },
  {
    id: "slate-blue",
    name: "深海蓝 (Slate Blue)",
    color: "#3B82F6",
    cssVars: {
      light: {
        "--primary": "#3B82F6",
        "--primary-hover": "#2563EB",
        "--secondary": "#60A5FA",
        "--muted": "#EFF6FF",
      },
      dark: {
        "--primary": "#60A5FA",
        "--primary-hover": "#93C5FD",
        "--secondary": "#3B82F6",
        "--muted": "#1E293B",
      },
    },
  },
  {
    id: "emerald",
    name: "翡翠绿 (Emerald Green)",
    color: "#10B981",
    cssVars: {
      light: {
        "--primary": "#10B981",
        "--primary-hover": "#059669",
        "--secondary": "#34D399",
        "--muted": "#ECFDF5",
      },
      dark: {
        "--primary": "#34D399",
        "--primary-hover": "#6EE7B7",
        "--secondary": "#10B981",
        "--muted": "#064E3B",
      },
    },
  },
  {
    id: "rose",
    name: "玫瑰红 (Rose)",
    color: "#F43F5E",
    cssVars: {
      light: {
        "--primary": "#F43F5E",
        "--primary-hover": "#E11D48",
        "--secondary": "#FB7185",
        "--muted": "#FFF1F2",
      },
      dark: {
        "--primary": "#FB7185",
        "--primary-hover": "#FDA4AF",
        "--secondary": "#F43F5E",
        "--muted": "#4C0519",
      },
    },
  },
  {
    id: "zinc",
    name: "中性灰 (Zinc)",
    color: "#52525B",
    cssVars: {
      light: {
        "--primary": "#52525B",
        "--primary-hover": "#3F3F46",
        "--secondary": "#71717A",
        "--muted": "#F4F4F5",
      },
      dark: {
        "--primary": "#A1A1AA",
        "--primary-hover": "#D4D4D8",
        "--secondary": "#71717A",
        "--muted": "#27272A",
      },
    },
  },
];

export function getThemeCss(themeId: string | null | undefined) {
  const preset = THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];
  
  let css = ":root {\n";
  for (const [key, value] of Object.entries(preset.cssVars.light)) {
    css += `  ${key}: ${value};\n`;
  }
  css += "}\n\n.dark {\n";
  for (const [key, value] of Object.entries(preset.cssVars.dark)) {
    css += `  ${key}: ${value};\n`;
  }
  css += "}\n";
  
  return css;
}
