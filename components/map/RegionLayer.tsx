"use client";

type RegionLayerButtonProps = {
  active?: boolean;
  hovered?: boolean;
  label: string;
  onClick: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
};

export function RegionLayerButton({
  active = false,
  hovered = false,
  label,
  onClick,
  onHoverStart,
  onHoverEnd,
}: RegionLayerButtonProps) {
  return (
    <button
      type="button"
      aria-label={`${label} bölgesini seç`}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      onClick={onClick}
      className={`h-4 w-4 rounded-full border-2 transition-all ${
        active
          ? "scale-125 border-emerald-800 bg-emerald-600 shadow-[0_0_0_8px_rgba(16,185,129,0.2)]"
          : hovered
            ? "scale-110 border-emerald-700 bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.2)]"
            : "border-emerald-700/80 bg-emerald-400/85 shadow-[0_0_0_3px_rgba(255,255,255,0.9)]"
      }`}
    />
  );
}
