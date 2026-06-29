import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border font-medium",
  {
    variants: {
      variant: {
        default:  "border-transparent bg-emerald-500/15 text-emerald-400",
        outline:  "border-border text-muted-foreground",
        warning:  "border-transparent bg-orange-500/20 text-orange-400",
        info:     "border-transparent bg-blue-500/20 text-blue-400",
        muted:    "border-transparent bg-purple-500/20 text-purple-400",
      },
      size: {
        default: "rounded-full px-2 py-0.5 text-xs",
        sm:      "rounded px-1 py-0 text-[14px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & BadgeVariants;

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}
