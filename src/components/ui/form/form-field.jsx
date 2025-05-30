"use client";

function FormField({ name, control, render }) {
  if (!control || !name || !render) return null;

  const { field } = control.register
    ? {
        field: {
          name,
          ...control.register(name),
        },
      }
    : { field: { name } };

  return render({ field });
}

FormField.displayName = "FormField";

export { FormField };
