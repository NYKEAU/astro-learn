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

const subjects = [
  { id: "planets", label: "Planets and Solar System" },
  { id: "stars", label: "Stars and Constellations" },
  { id: "galaxies", label: "Galaxies and Universe" },
  { id: "telescopes", label: "Telescopes and Equipment" },
];

export function AstronomyKnowledge({ form }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="knownSubjects"
        render={({ field }) => (
          <FormItem>
            <FormLabel>What topics are you already familiar with?</FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {subjects.map((subject) => (
                <FormControl key={subject.id}>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={field.value?.includes(subject.id)}
                      onCheckedChange={(checked) => {
                        const updatedValue = checked
                          ? [...(field.value || []), subject.id]
                          : field.value?.filter(
                              (value) => value !== subject.id
                            ) || [];
                        field.onChange(updatedValue);
                      }}
                    />
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {subject.label}
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

AstronomyKnowledge.propTypes = {
  form: PropTypes.object.isRequired,
};
