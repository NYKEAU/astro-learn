import { cn } from "@/lib/utils";

export const inputVariants = () => {
  return cn(
    "form-input",
    "bg-background/5 border border-white/10",
    "focus:border-white/20 focus:ring-1 focus:ring-white/20",
    "placeholder:text-white/50",
    "transition-all duration-200"
  );
};
