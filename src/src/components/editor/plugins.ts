import Paragraph from "@yoopta/paragraph";
import Headings from "@yoopta/headings";
import Lists from "@yoopta/lists";
import Blockquote from "@yoopta/blockquote";
import Callout from "@yoopta/callout";
import CodePlugins from "@yoopta/code";
import Image from "@yoopta/image";
import Video from "@yoopta/video";
import Embed from "@yoopta/embed";
import File from "@yoopta/file";
import Table from "@yoopta/table";
import Accordion from "@yoopta/accordion";
import Tabs from "@yoopta/tabs";
import Steps from "@yoopta/steps";
import Divider from "@yoopta/divider";
import LinkPlugin from "@yoopta/link";
import Mention from "@yoopta/mention";
import Emoji from "@yoopta/emoji";
import Carousel from "@yoopta/carousel";
import TableOfContents from "@yoopta/table-of-contents";
import {
  Bold,
  Italic,
  Underline,
  Strike,
  CodeMark,
  Highlight,
} from "@yoopta/marks";
import { applyTheme } from "@yoopta/themes-shadcn";

// Custom Image plugin with upload endpoint
const ImageWithUpload = Image.extend({
  options: {
    upload: async (file: globalThis.File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();

      return {
        id: data.url,
        src: data.url,
        alt: file.name,
        sizes: { width: 650, height: "auto" as const },
      };
    },
  },
});

// All plugins (before theme)
const RAW_PLUGINS = [
  Paragraph,
  Headings.HeadingOne,
  Headings.HeadingTwo,
  Headings.HeadingThree,
  Lists.BulletedList,
  Lists.NumberedList,
  Lists.TodoList,
  Blockquote,
  Callout,
  CodePlugins.Code,
  ImageWithUpload,
  Video,
  Embed,
  File,
  Table,
  Accordion,
  Tabs,
  Steps,
  Divider,
  LinkPlugin,
  Mention,
  Emoji,
  Carousel,
  TableOfContents,
];

// Apply shadcn theme to all plugins
export const PLUGINS = applyTheme(RAW_PLUGINS as any[]);

// Text formatting marks
export const MARKS = [Bold, Italic, Underline, Strike, CodeMark, Highlight];
