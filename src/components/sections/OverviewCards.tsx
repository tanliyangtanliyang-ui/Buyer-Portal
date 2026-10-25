import { ClipboardList, Truck, Leaf, Package, ArrowRight, Loader2 } from 'lucide-react';
import type { PageId } from '@/components/Sidebar';
import { useBuyerInsights, kg, pctText, isOpenOrder } from '@/lib/insights';

// Dashboard cards from this buyer's own records (live orders + dataset delivery history). No made-up trends.
export default function OverviewCards({ setPage }: { setPage: (p: PageId) => void }) {
  const { data, error, loading } = useBuyerInsights();
  const live = data?.live; const k = data?.deliveries.kpis;
  const outForDelivery = live?.orders.filter((o) => ['dispatched', 'in_transit'].includes(o.progress?.stage ?? '')).length ?? 0;
  const freshOpen = live?.orders.filter(isOpenOrder).flatMap((o) => o.lines).filter((l) => l.freshness.state === 'fresh').length ?? 0;

  const cards = [
    { id: 'orders', label: 'Orders in progress', value: live ? String(live.totals.open) : '…', sub: live ? `${live.totals.orders} placed in the portal · ${kg(live.totals.kg)}` : '', icon: ClipboardList, target: 'orders' as PageId },
    { id: 'tracking', label: 'Out for delivery', value: live ? String(outForDelivery) : '…', sub: 'driver assigned or on the way', icon: Truck, target: 'tracking' as PageId },
    { id: 'freshness', label: 'Open order lines still fresh', value: live ? String(freshOpen) : '…', sub: 'more than half the shelf life left', icon: Leaf, target: 'freshness' as PageId },
    { id: 'history', label: 'On-time deliveries (history)', value: k ? pctText(k.on_time_pct) : '…', sub: k ? `${k.deliveries} deliveries · ${kg(k.delivered_kg)} (dataset) · failed or rejected count as missed` : '', icon: Package, target: 'tracking' as PageId },
  ];

  if (error) return <div className="card p-4 text-sm text-red-700 bg-red-50" role="alert">Could not load your records: {error}</div>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-testid="overview-cards">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <button key={c.id} type="button" onClick={() => setPage(c.target)} className="card p-5 text-left hover:shadow-pop transition-all duration-300 group">
            <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center mb-3 group-hover:bg-brand-100 transition">
              {loading ? <Loader2 className="w-5 h-5 text-brand-400 animate-spin" /> : <Icon className="w-[22px] h-[22px] text-brand-600" />}
            </div>
            <p className="text-xs font-semibold text-brand-600/60 uppercase tracking-wide">{c.label}</p>
            <p className="font-display text-2xl font-extrabold text-brand-900 mt-1">{c.value}</p>
            <p className="text-xs text-brand-500 mt-0.5 flex items-center justify-between gap-2">{c.sub}<ArrowRight className="w-4 h-4 text-brand-400 shrink-0" /></p>
          </button>
        );
      })}
    </div>
  );
}
