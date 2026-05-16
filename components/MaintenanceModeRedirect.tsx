"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

type MaintenanceModeRedirectProps = {
  isMaintenanceMode: boolean;
};

export function MaintenanceModeRedirect({
  isMaintenanceMode,
}: MaintenanceModeRedirectProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isMaintenanceMode && pathname !== "/bakimdayiz") {
      router.replace("/bakimdayiz");
      return;
    }

    if (!isMaintenanceMode && pathname === "/bakimdayiz") {
      router.replace("/");
    }
  }, [isMaintenanceMode, pathname, router]);

  return null;
}

