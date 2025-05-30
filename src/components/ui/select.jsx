"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <select
      className={cn("form-select-modern", className)}
      ref={ref}
      {...props}
    />
  );
});
Select.displayName = "Select";

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

Select.Option = SelectOption;

export { Select };
