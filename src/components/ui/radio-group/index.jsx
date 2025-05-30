"use client";

import { createContext, forwardRef, useContext, useId } from "react";
import { cn } from "@/lib/utils";

const RadioGroupContext = createContext({});

const RadioGroup = forwardRef(
  ({ className, value, onValueChange, ...props }, ref) => {
    const id = useId();
    return (
      <RadioGroupContext.Provider value={{ name: id, value, onValueChange }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </RadioGroupContext.Provider>
    );
  }
);

RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = forwardRef(({ className, value, ...props }, ref) => {
  const {
    name,
    value: groupValue,
    onValueChange,
  } = useContext(RadioGroupContext);
  const checked = value === groupValue;

  return (
    <div className="relative">
      <input
        type="radio"
        ref={ref}
        id={`${name}-${value}`}
        name={name}
        value={value}
        checked={checked}
        onChange={() => onValueChange(value)}
        className="peer absolute h-4 w-4 opacity-0"
        {...props}
      />
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-black/40 transition-colors",
          checked && "border-primary",
          className
        )}
      >
        {checked && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </div>
    </div>
  );
});

RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
