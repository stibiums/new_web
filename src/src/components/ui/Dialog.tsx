"use client";

import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useContext,
  createContext,
  type ReactNode,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";

/** 用于 DialogContent 向外层容器传递尺寸/样式 */
const DialogContainerCtx = createContext<{
  setContainerClass: React.Dispatch<React.SetStateAction<string>>;
} | null>(null);

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
  // DialogContent 可通过 context 动态覆盖容器尺寸类
  const [containerClass, setContainerClass] = useState("max-w-lg");

  if (!open) return null;

  return createPortal(
    <DialogContainerCtx.Provider value={{ setContainerClass }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* 背景遮罩 */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => onOpenChange?.(false)}
        />
        {/* 弹窗内容 */}
        <div
          className={`relative z-10 w-full mx-auto bg-[var(--color-background)] rounded-xl shadow-2xl border border-[var(--color-border)] animate-in fade-in zoom-in-95 duration-200 ${containerClass}`}
        >
          {children}
        </div>
      </div>
    </DialogContainerCtx.Provider>,
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
  const ctx = useContext(DialogContainerCtx);

  // 将 className 传递给外层容器，让容器承载尺寸/布局样式
  useLayoutEffect(() => {
    if (ctx && className) {
      ctx.setContainerClass(className);
    }
    return () => {
      // 弹窗关闭后恢复默认尺寸
      ctx?.setContainerClass("max-w-lg");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [className]);

  // DialogContent 本身不再渲染多余的 div，直接透传子节点
  return <>{children}</>;
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
