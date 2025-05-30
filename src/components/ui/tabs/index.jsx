"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { TabsList } from "./tabs-list";
import { TabsTrigger } from "./tabs-trigger";
import { TabsContent } from "./tabs-content";

const Tabs = forwardRef(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("w-full", className)} {...props} />;
});

Tabs.displayName = "Tabs";

export { Tabs, TabsList, TabsTrigger, TabsContent };
