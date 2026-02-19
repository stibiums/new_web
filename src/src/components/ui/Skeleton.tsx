import { HTMLAttributes, forwardRef } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className = "", width, height, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          animate-pulse rounded-md bg-[var(--color-muted)]
          ${className}
        `}
        style={{
          width: width ?? "100%",
          height: height ?? "1rem",
          ...style,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

// 预置的常用骨架屏组合
export function PostCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
      <Skeleton height="1.5rem" width="70%" />
      <Skeleton height="1rem" width="100%" />
      <Skeleton height="1rem" width="90%" />
      <div className="flex gap-2 pt-2">
        <Skeleton width="60px" height="20px" />
        <Skeleton width="80px" height="20px" />
      </div>
    </div>
  );
}

export function UserCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton width="40px" height="40px" className="rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton height="1rem" width="120px" />
        <Skeleton height="0.75rem" width="80px" />
      </div>
    </div>
  );
}
