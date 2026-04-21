import { getSafeExternalUrl } from "@/utils/security";

export function SafeLink({
  href,
  children,
  className,
  disabledClassName,
  invalidLabel,
}) {
  const safeHref = getSafeExternalUrl(href);

  if (!safeHref) {
    return (
      <span
        aria-disabled="true"
        aria-label={invalidLabel}
        className={disabledClassName ?? className}
        role="link"
        title={invalidLabel}
      >
        {invalidLabel ?? children}
      </span>
    );
  }

  return (
    <a href={safeHref} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
