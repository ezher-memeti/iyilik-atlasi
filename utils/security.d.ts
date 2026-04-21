export const allowedDonationDomains: string[];

export function isAllowedDonationDomain(hostname: string): boolean;

export function isSafeExternalUrl(url: string): boolean;

export function getSafeExternalUrl(url: string): string | null;
