const ADMIN_TEXT_PATTERN = /^[A-Za-z0-9ÇĞİÖŞÜçğıöşü\s\-./(),:]+$/;

export function isAllowedAdminText(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return ADMIN_TEXT_PATTERN.test(trimmed);
}

export function getAdminTextValidationMessage(fieldLabel: string) {
  return `${fieldLabel} sadece Türkçe/İngilizce harf, rakam, boşluk ve - . / ( ) , : karakterlerini içerebilir.`;
}
