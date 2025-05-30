"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import PropTypes from "prop-types";

const goals = [
  { id: "basics", label: "Learning the basics of astronomy" },
  { id: "deepening", label: "Deepening my existing knowledge" },
  { id: "quizzes", label: "Participating in quizzes and games" },
  { id: "advanced", label: "Exploring advanced theories" },
];

export function LearningGoals({ form }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="learningGoals"
        render={({ field }) => (
          <FormItem>
            <FormLabel>What are your learning goals?</FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {goals.map((goal) => (
                <FormControl key={goal.id}>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={field.value?.includes(goal.id)}
                      onCheckedChange={(checked) => {
                        const updatedValue = checked
                          ? [...(field.value || []), goal.id]
                          : field.value?.filter((value) => value !== goal.id) ||
                            [];
                        field.onChange(updatedValue);
                      }}
                    />
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {goal.label}
                    </label>
                  </div>
                </FormControl>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

LearningGoals.propTypes = {
  form: PropTypes.object.isRequired,
};
