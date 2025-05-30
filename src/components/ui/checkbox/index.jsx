"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const Checkbox = forwardRef(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="peer absolute h-4 w-4 opacity-0"
          {...props}
        />
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded border border-white/30 bg-black/40 transition-colors",
            checked && "bg-primary border-primary",
            className
          )}
        >
          {checked && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
