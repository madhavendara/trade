import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-medium transition-all",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        // Figma primary — gradient with inner white highlight
        primary: [
          "relative overflow-hidden rounded-[8px] text-white",
          "[background:linear-gradient(-71.93deg,#7D00FF_6.49%,#FE7DF5_81.98%,#E30EAB_170.46%)]",
          "shadow-[inset_0px_4px_4px_rgba(255,255,255,0.4)]",
          "hover:brightness-110 active:brightness-95",
        ].join(" "),
        default:
          "rounded-md bg-primary text-primary-foreground shadow hover:bg-primary/90",
        outline:
          "rounded-md border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
        ghost:
          "rounded-md hover:bg-accent hover:text-accent-foreground",
        destructive:
          "rounded-md bg-red-500 text-white hover:bg-red-600",
        // Subtle violet — used for sidebar active state etc.
        violet:
          "rounded-md bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700",
      },
      size: {
        default: "h-[45px] px-4 text-[14px]",
        sm: "h-7 px-2.5 text-xs",
        lg: "h-11 px-8 text-sm",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
