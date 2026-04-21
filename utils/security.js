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
    const parsedUrl = new URL(url);

    return (
      parsedUrl.protocol === "https:" &&
      isAllowedDonationDomain(parsedUrl.hostname)
    );
  } catch {
    return false;
  }
}

export function getSafeExternalUrl(url) {
  return isSafeExternalUrl(url) ? url : null;
}
