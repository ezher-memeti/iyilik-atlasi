"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useMapFilterSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function applyRegionToUrl(regionName: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("bolge", regionName);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return { applyRegionToUrl };
}
