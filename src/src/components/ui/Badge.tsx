import { HTMLAttributes, forwardRef } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive";
}

const variantStyles = {
  default: "bg-[var(--color-primary)] text-white",
  secondary: "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
  outline: "border border-[var(--color-border)] text-[var(--color-foreground)]",
  success: "bg-[var(--color-success)] text-white",
  warning: "bg-[var(--color-accent)] text-white",
  destructive: "bg-[var(--color-destructive)] text-white",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "default", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center rounded-full px-2.5 py-0.5
          text-xs font-semibold transition-colors
          ${variantStyles[variant]}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
