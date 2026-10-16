import { ClipboardList, Truck, Leaf, Package, ArrowRight, Loader2 } from 'lucide-react';
import { Sparkline, TrendIndicator, Badge } from '@/components/ui';
import type { PageId } from '@/components/Sidebar';
import { useLiveData, useLiveSingle } from '@/lib/useLiveData';
import { BUYER_CODE } from '@/lib/local';
import type { Order, Route, Buyer } from '@/lib/types';

const iconMap: Record<string, React.ElementType> = {
  ClipboardList,
  Truck,
  Leaf,
  Package,
};

export default function OverviewCards({ setPage }: { setPage: (p: PageId) => void }) {
  const { data: buyer } = useLiveSingle<Buyer>('buyers', '*', { code: BUYER_CODE });
  const buyerId = buyer?.id;
  const { data: orders, loading: lOrders } = useLiveData<Order>(
    'orders',
    '*',
    (q: any) => (buyerId ? q.eq('buyer_id', buyerId) : q)
  );
  const { data: routes } = useLiveData<Route>('routes', '*');

  const activeOrders = orders?.filter((o) => o.status !== 'Delivered') ?? [];
  const incoming = routes?.filter((r) => r.status === 'In Transit') ?? [];
  const avgFreshness = routes && routes.length > 0
    ? Math.round(routes.reduce((s, r) => s + r.freshness, 0) / routes.length)
    : 95;
  const monthlyVolume = orders?.reduce((s, o) => s + o.quantity_kg, 0) ?? 8450;

  const cards = [
    {
      id: 'orders',
      label: 'Active Orders',
      value: lOrders ? '…' : String(activeOrders.length || 12),
      sub: `${orders?.filter((o) => o.status === 'Processing').length ?? 0} awaiting confirmation`,
      icon: 'ClipboardList',
      trend: 'up' as const,
      trendValue: '+2 this week',
      badge: 'On track',
      badgeTone: 'green' as const,
      spark: [4, 6, 5, 7, 6, 8, 10, activeOrders.length || 12],
      target: 'orders' as PageId,
    },
    {
      id: 'deliveries',
      label: 'Incoming Deliveries',
      value: lOrders ? '…' : `${incoming.length || 5} trucks`,
      sub: `${incoming.filter((r) => r.eta_minutes < 60).length} arriving soon`,
      icon: 'Truck',
      trend: 'up' as const,
      trendValue: '+1 vs yesterday',
      badge: 'In transit',
      badgeTone: 'blue' as const,
      spark: [2, 3, 3, 4, 3, 5, 4, incoming.length || 5],
      target: 'tracking' as PageId,
    },
    {
      id: 'freshness',
      label: 'Average Freshness Score',
      value: lOrders ? '…' : `${avgFreshness}%`,
      sub: 'Across all shipments',
      icon: 'Leaf',
      trend: 'up' as const,
      trendValue: '+3% vs last month',
      badge: 'Excellent',
      badgeTone: 'green' as const,
      spark: [88, 90, 89, 92, 91, 93, 94, avgFreshness],
      target: 'freshness' as PageId,
    },
    {
      id: 'volume',
      label: 'Monthly Purchase Volume',
      value: lOrders ? '…' : `${monthlyVolume.toLocaleString()} kg`,
      sub: 'Of fresh produce',
      icon: 'Package',
      trend: 'up' as const,
      trendValue: '+640 kg vs last month',
      badge: 'Growing',
      badgeTone: 'amber' as const,
      spark: [5200, 6100, 5800, 6900, 7300, 7600, 8100, monthlyVolume],
      target: 'reports' as PageId,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = iconMap[c.icon] ?? Package;
        return (
          <div
            key={c.id}
            className="card p-5 hover:shadow-pop transition-all duration-300 hover:-translate-y-0.5 animate-fade-up cursor-pointer group"
            style={{ animationDelay: `${i * 70}ms` }}
            onClick={() => setPage(c.target)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition">
                {lOrders ? <Loader2 className="w-5 h-5 text-brand-400 animate-spin" /> : <Icon className="w-[22px] h-[22px] text-brand-600" />}
              </div>
              <Badge tone={c.badgeTone}>{c.badge}</Badge>
            </div>
            <p className="text-xs font-semibold text-brand-600/60 uppercase tracking-wide">{c.label}</p>
            <p className="font-display text-2xl font-extrabold text-brand-900 mt-1">{c.value}</p>
            <p className="text-xs text-brand-500 mt-0.5">{c.sub}</p>
            <div className="mt-3">
              <Sparkline data={c.spark} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <TrendIndicator trend={c.trend} value={c.trendValue} />
              <ArrowRight className="w-4 h-4 text-brand-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
