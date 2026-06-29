import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardBase        = cva("rounded-[4px] bg-[#1c1c1d]");
const cardHeaderBase  = cva("flex flex-col gap-1 p-4");
const cardTitleBase   = cva("font-medium leading-none tracking-tight text-[14px]");
const cardContentBase = cva("py-4 pl-4 lg:pr-4 pt-0");

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(cardBase(), className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(cardHeaderBase(), className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn(cardTitleBase(), className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(cardContentBase(), className)} {...props} />;
}
