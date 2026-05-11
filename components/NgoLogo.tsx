"use client";

import { useMemo, useState } from "react";

type NgoLogoProps = {
  name: string;
  logoUrl?: string;
  className?: string;
};

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !["derneği", "vakfı", "platformu", "insani"].includes(part.toLowerCase()));

  const letters = (parts.length > 0 ? parts : name.split(/\s+/))
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR"))
    .join("");

  return letters || "ST";
}

export function NgoLogo({ name, logoUrl, className = "" }: NgoLogoProps) {
  const [failed, setFailed] = useState(false);

  const initials = useMemo(() => getInitials(name), [name]);
  const normalizedLogoUrl = logoUrl?.trim() ?? "";
  const showImage = Boolean(normalizedLogoUrl) && !failed;

  if (!showImage) {
    return (
      <div
        aria-label={`${name} kısaltma logosu`}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-xs font-semibold text-emerald-800 ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={normalizedLogoUrl}
      alt={`${name} logosu`}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`h-11 w-11 rounded-lg object-contain bg-white/90 p-1 ${className}`}
    />
  );
}
