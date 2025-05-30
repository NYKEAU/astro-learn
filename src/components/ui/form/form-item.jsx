"use client";

import { cn } from "@/lib/utils";

function FormItem({ children, className, ...props }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {children}
    </div>
  );
}

FormItem.displayName = "FormItem";

export { FormItem };
