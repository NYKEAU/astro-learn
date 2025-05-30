"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const SelectOption = React.forwardRef(
  ({ children, value, className, ...props }, ref) => (
    <option
      ref={ref}
      value={value}
      className={cn(
        "py-2 px-3 cursor-pointer bg-background text-white",
        className
      )}
      {...props}
    >
      {children}
    </option>
  )
);

SelectOption.displayName = "SelectOption";

export { SelectOption };
