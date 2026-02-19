import { TextareaHTMLAttributes, forwardRef } from "react";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`
          flex min-h-[80px] w-full rounded-lg border border-[var(--color-border)]
          bg-[var(--color-card)] px-3 py-2 text-sm
          text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]
          focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
          resize-none
          ${className}
        `}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
