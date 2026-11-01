export default function AdSlot({ size = 'banner', className = '' }) {
  const dimensions =
    size === 'banner' ? 'w-full h-24 sm:h-28' : 'w-full aspect-video';
  return (
    <div
      className={`${dimensions} ${className} flex items-center justify-center rounded-xl border border-dashed border-white/15 bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400`}
      role="complementary"
      aria-label="Advertisement"
    >
      Advertisement
    </div>
  );
}
