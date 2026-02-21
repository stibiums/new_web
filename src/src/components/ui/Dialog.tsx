"use client";

import React, { useState, useEffect, useCallback, type ReactNode, type ReactElement } from "react";
import { createPortal } from "react-dom";

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && onOpenChange) {
        onOpenChange(false);
      }
    },
    [open, onOpenChange]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!mounted) return null;

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogRoot>
  );
}

function DialogRoot({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
      />
      {/* 弹窗内容 */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-[var(--color-background)] rounded-xl shadow-lg border border-[var(--color-border)] animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>,
    document.body
  );
}

export interface DialogTriggerProps {
  asChild?: boolean;
  children: ReactNode;
}

export function DialogTrigger({ children }: DialogTriggerProps) {
  return <>{children}</>;
}

export interface DialogContentProps {
  children: ReactNode;
  className?: string;
}

export function DialogContent({ children, className = "" }: DialogContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export interface DialogHeaderProps {
  children: ReactNode;
  className?: string;
}

export function DialogHeader({ children, className = "" }: DialogHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-[var(--color-border)] ${className}`}>
      {children}
    </div>
  );
}

export interface DialogTitleProps {
  children: ReactNode;
  className?: string;
}

export function DialogTitle({ children, className = "" }: DialogTitleProps) {
  return (
    <h2 className={`text-lg font-semibold text-[var(--color-foreground)] ${className}`}>
      {children}
    </h2>
  );
}

export interface DialogDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function DialogDescription({
  children,
  className = "",
}: DialogDescriptionProps) {
  return (
    <p className={`text-sm text-[var(--color-muted-foreground)] mt-1 ${className}`}>
      {children}
    </p>
  );
}

export interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

export function DialogFooter({ children, className = "" }: DialogFooterProps) {
  return (
    <div
      className={`px-6 py-4 border-t border-[var(--color-border)] flex justify-end gap-3 ${className}`}
    >
      {children}
    </div>
  );
}

export interface DialogCloseProps {
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
  asChild?: boolean;
}

export function DialogClose({ children, onClick, className = "", asChild }: DialogCloseProps) {
  if (asChild && children) {
    // 使用 cloneElement 让子元素作为按钮
    return React.cloneElement(children as ReactElement<any>, {
      onClick,
    });
  }
  return (
    <button
      onClick={onClick}
      className={`text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors ${className}`}
      type="button"
    >
      {children}
    </button>
  );
}
