"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import PropTypes from "prop-types";

const interests = [
  { id: "planets", label: "Planets and Solar System" },
  { id: "stars", label: "Stars and Constellations" },
  { id: "galaxies", label: "Galaxies and Universe" },
  { id: "telescopes", label: "Telescopes and Equipment" },
];

const learningPreferences = [
  { value: "visual", label: "Visual Learning" },
  { value: "interactive", label: "Interactive Exercises" },
  { value: "reading", label: "Reading Materials" },
  { value: "practical", label: "Practical Activities" },
];

export function InterestsPreferences({ form }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="interests"
        render={({ field }) => (
          <FormItem>
            <FormLabel>What interests you the most?</FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {interests.map((interest) => (
                <FormControl key={interest.id}>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={field.value?.includes(interest.id)}
                      onCheckedChange={(checked) => {
                        const updatedValue = checked
                          ? [...(field.value || []), interest.id]
                          : field.value?.filter(
                              (value) => value !== interest.id
                            ) || [];
                        field.onChange(updatedValue);
                      }}
                    />
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {interest.label}
                    </label>
                  </div>
                </FormControl>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="learningPreference"
        render={({ field }) => (
          <FormItem>
            <FormLabel>How do you prefer to learn?</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2"
              >
                {learningPreferences.map((pref) => (
                  <div key={pref.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={pref.value} />
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {pref.label}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

InterestsPreferences.propTypes = {
  form: PropTypes.object.isRequired,
};
