"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const TabsList = forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
});

TabsList.displayName = "TabsList";

export { TabsList };
