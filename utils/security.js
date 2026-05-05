export const allowedDonationDomains = [
  "kizilay.org.tr",
  "ihh.org.tr",
  "tdv.org",
  "sadeceinsan.org.tr",
];

export function isAllowedDonationDomain(hostname) {
  return allowedDonationDomains.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

export function isSafeExternalUrl(url) {
  try {
    const parsedUrl = new URL(String(url).trim());
    const isHttp = parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    const isUnsafeHost =
      parsedUrl.hostname === "localhost" ||
      parsedUrl.hostname === "127.0.0.1" ||
      parsedUrl.hostname === "::1";

    return isHttp && !isUnsafeHost;
  } catch {
    return false;
  }
}

export function getSafeExternalUrl(url) {
  const normalized = String(url ?? "").trim();
  return isSafeExternalUrl(normalized) ? normalized : null;
}
