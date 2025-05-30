"use client";

import { cn } from "@/lib/utils";

function FormControl({ children, className, ...props }) {
  return (
    <div className={cn("form-control", className)} {...props}>
      {children}
    </div>
  );
}

FormControl.displayName = "FormControl";

export { FormControl };
