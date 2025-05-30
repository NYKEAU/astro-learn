"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const RadioGroupItem = forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      type="radio"
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});

RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroupItem };
