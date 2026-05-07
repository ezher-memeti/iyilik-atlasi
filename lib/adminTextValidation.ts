const ADMIN_TEXT_PATTERN = /^[A-Za-z0-9ÇĞİÖŞÜçğıöşü _+\-\/:;!?\\#=.,()'""]+$/;

function normalizeAdminText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function isAllowedAdminText(value: string) {
  const normalized = normalizeAdminText(value);
  if (!normalized) return true;
  return ADMIN_TEXT_PATTERN.test(normalized);
}

export function getAdminTextValidationMessage(fieldLabel: string) {
  return `${fieldLabel} sadece Türkçe/İngilizce harf, rakam, boşluk ve şu karakterleri içerebilir: _ + - / : ; ! ? \\\\ # = . , ( ) ' ".`;
}
