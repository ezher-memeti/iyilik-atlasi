import common from "@/content/common.json";

export function Disclaimer() {
  return (
    <div className="rounded-lg border border-emerald-900/10 bg-white/85 px-4 py-3 text-sm font-medium leading-6 text-slate-700">
      <p>{common.trust.noPayment}</p>
      <p className="mt-1">{common.trust.officialDescriptions}</p>
    </div>
  );
}
