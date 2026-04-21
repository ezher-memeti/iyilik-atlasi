import type { ReactNode } from "react";

export function SafeLink(props: {
  href: string;
  children: ReactNode;
  className?: string;
  disabledClassName?: string;
  invalidLabel?: string;
}): ReactNode;
