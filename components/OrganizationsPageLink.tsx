"use client";

import Link, { type LinkProps } from "next/link";
import type { MouseEvent, ReactNode } from "react";

const ORGANIZATIONS_STATE_KEY = "organizations_showcase_state_v1";
const ORGANIZATIONS_RESTORE_INTENT_KEY = "organizations_showcase_restore_intent_v1";

type OrganizationsPageLinkProps = LinkProps & {
  className?: string;
  children: ReactNode;
  ariaCurrent?: "page";
};

export function clearOrganizationsRestoreState() {
  try {
    window.sessionStorage.removeItem(ORGANIZATIONS_STATE_KEY);
    window.sessionStorage.removeItem(ORGANIZATIONS_RESTORE_INTENT_KEY);
  } catch {
    // no-op
  }
}

export function OrganizationsPageLink({
  className,
  children,
  onClick,
  ...props
}: OrganizationsPageLinkProps & {
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      {...props}
      className={className}
      onClick={(event) => {
        clearOrganizationsRestoreState();
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
