export function getFieldTranslations(field, language) {
  return field?.[language] || field?.fr || field?.en || field || "";
}
