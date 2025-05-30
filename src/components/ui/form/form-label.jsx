"use client";

import { cn } from "@/lib/utils";

function FormLabel({ children, className, ...props }) {
  return (
    <label
      className={cn("text-base font-medium text-white/90 block", className)}
      {...props}
    >
      {children}
    </label>
  );
}

FormLabel.displayName = "FormLabel";

export { FormLabel };
