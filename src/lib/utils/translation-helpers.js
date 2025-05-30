import { useLanguage } from "@/lib/LanguageContext";

export const getFieldTranslations = (fieldName) => {
  const { t } = useLanguage();
  return {
    label: t(`registration.form.fields.${fieldName}.label`),
    placeholder: t(`registration.form.fields.${fieldName}.placeholder`),
    error: t(`registration.form.fields.${fieldName}.error`),
  };
};
