"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const TabsContent = forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
});

TabsContent.displayName = "TabsContent";

export { TabsContent };
