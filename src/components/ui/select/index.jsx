"use client";

import { forwardRef, createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const SelectContext = createContext({});

const Select = forwardRef(
  ({ children, placeholder, value, onChange, className, ...props }, ref) => {
    const [open, setOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value || "");

    const handleSelect = (optionValue) => {
      setSelectedValue(optionValue);
      if (onChange) {
        onChange(optionValue);
      }
      setOpen(false);
    };

    return (
      <SelectContext.Provider
        value={{ open, setOpen, value: selectedValue, onSelect: handleSelect }}
      >
        <div className="relative" ref={ref} {...props}>
          <div
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white ring-offset-background focus:outline-none focus:border-primary/70 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
              className
            )}
            onClick={() => setOpen(!open)}
          >
            <span className={!selectedValue ? "text-white/50" : ""}>
              {selectedValue
                ? children.find((child) => child.props.value === selectedValue)
                    ?.props.children
                : placeholder}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
          {open && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-white/20 bg-black/90 p-1 text-white shadow-lg backdrop-blur-sm">
              {children}
            </div>
          )}
        </div>
      </SelectContext.Provider>
    );
  }
);

Select.displayName = "Select";

const SelectOption = ({ value, children, className, ...props }) => {
  const { onSelect, value: selectedValue } = useContext(SelectContext);

  return (
    <div
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-white/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        selectedValue === value && "bg-primary/20 text-primary",
        className
      )}
      onClick={() => onSelect(value)}
      {...props}
    >
      {children}
    </div>
  );
};

SelectOption.displayName = "SelectOption";

export { Select, SelectOption };
