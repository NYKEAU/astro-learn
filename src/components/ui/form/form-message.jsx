"use client";

import { cn } from "@/lib/utils";

function FormMessage({ children, className, ...props }) {
  if (!children) return null;

  return (
    <p className={cn("text-sm font-medium text-red-400", className)} {...props}>
      {children}
    </p>
  );
}

FormMessage.displayName = "FormMessage";

export { FormMessage };
