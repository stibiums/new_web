import { Github, Mail, Linkedin, Youtube, Tv, Facebook, Instagram, Twitch, MessageCircle, Globe } from "lucide-react";

export const SocialIcon = ({ platform, className }: { platform: string, className?: string }) => {
  const p = platform.toLowerCase();
  if (p.includes('github')) return <Github className={className} />;
  if (p.includes('linkedin')) return <Linkedin className={className} />;
  if (p.includes('youtube')) return <Youtube className={className} />;
  if (p.includes('bilibili')) return <Tv className={className} />;
  if (p.includes('twitter') || p.includes('x')) return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
  if (p.includes('mail') || p.includes('email')) return <Mail className={className} />;
  if (p.includes('facebook')) return <Facebook className={className} />;
  if (p.includes('instagram')) return <Instagram className={className} />;
  if (p.includes('twitch')) return <Twitch className={className} />;
  if (p.includes('wechat') || p.includes('discord') || p.includes('telegram')) return <MessageCircle className={className} />;
  return <Globe className={className} />;
};
