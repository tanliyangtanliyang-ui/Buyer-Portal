import { useMemo, useState } from 'react';
import { Leaf, Loader2, Info, Thermometer, ArrowRight, PackageCheck } from 'lucide-react';
import { SectionHeader } from '@/components/ui';
import { useBuyerInsights, kg, dateText, isOpenOrder, type BuyerInsights, type ShelfLife } from '@/lib/insights';
import { ShelfRing, DecayCurve, LineChart, TONE_HEX, type Marker } from '@/components/FreshCharts';

// Freshness of the produce in this buyer's own orders. Open orders: shelf life left today. Delivered orders: shelf life left
// on the delivery day. Calculated from harvest date + product shelf life (no sensor).
type Line = { key: string; order: BuyerInsights['live']['orders'][number]; name: string | null; kg: number; storage: string | null; temp: [number, number] | null;
  harvest: string | null; shelf: number | null; f: ShelfLife; open: boolean; markers: Marker[] };
const EV: Record<string, [string, string]> = { placed: ['Ordered', '#0ea5e9'], accepted: ['Approved by hub', '#6366f1'], ready_for_pickup: ['Prepared at hub', '#a855f7'] };
const FILTERS = [{ key: 'open', label: 'In progress' }, { key: 'delivered', label: 'Delivered' }, { key: 'all', label: 'All' }] as const;

export default function FreshnessIntelligence({ compact = false }: { compact?: boolean }) {
  const { data, error, loading } = useBuyerInsights();
  const [filter, setFilter] = useState<'open' | 'delivered' | 'all'>('all');
  const [product, setProduct] = useState('all');
  const [sel, setSel] = useState<string | null>(null);
  const lines = useMemo<Line[]>(() => (data?.live.orders ?? []).filter((o) => !['rejected', 'cancelled'].includes(o.status)).flatMap((o) => o.lines.map((l) => {
    const open = isOpenOrder(o); const f = !open && l.freshness_at_delivery ? l.freshness_at_delivery : l.freshness;
    return { key: `${o.order_id}-${l.listing_id}`, order: o, name: l.product_name, kg: l.quantity_kg, storage: l.storage_class, temp: l.temp_range_c, harvest: l.harvest_date, shelf: l.shelf_life_days, f, open,
      markers: [
        ...(l.harvest_date ? [{ date: l.harvest_date, label: 'Harvested', color: '#65a30d' }] : []),
        ...o.events.filter((e) => EV[e.to_status]).map((e) => ({ date: e.at, label: EV[e.to_status][0], color: EV[e.to_status][1] })),
        ...(o.delivery.delivered_at ? [{ date: o.delivery.delivered_at, label: 'Delivered to you', color: '#0f766e' }] : []),
      ] };
  })), [data]);

  const n = (s: string) => lines.filter((l) => l.open && l.f.state === s).length;
  if (compact) {
    const open = lines.filter((l) => l.open).slice(0, 4);
    return (
      <section>
        <SectionHeader title="Freshness Monitoring" subtitle="Shelf life left for the produce in your orders" />
        {loading && <div className="flex items-center justify-center py-10 text-brand-400"><Loader2 className="w-6 h-6 animate-spin" /></div>}
        {data && (
          <div className="card p-5">
            {open.length === 0 ? <p className="text-sm text-brand-500 text-center py-6">No orders in progress.</p> : (
              <div className="grid grid-cols-2 gap-3">
                {open.map((l) => <div key={l.key} className="flex items-center gap-2"><ShelfRing pct={l.f.pct_left} tone={l.f.state} size={52} label={l.f.days_left != null ? `${Math.max(0, l.f.days_left)}d` : '—'} /><div className="text-xs"><p className="font-semibold text-brand-900">{l.name}</p><p className="text-brand-500">{l.order.order_id}</p></div></div>)}
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  const products = [...new Set(lines.map((l) => l.name ?? '—'))];
  const shown = lines.filter((l) => (filter === 'all' || (filter === 'open') === l.open) && (product === 'all' || l.name === product));
  const current = lines.find((l) => l.key === sel) ?? shown[0] ?? null;
  const fm = data?.deliveries.freshness_monthly ?? [];

  return (
    <section>
      <SectionHeader title="Freshness Monitoring" subtitle="Shelf life left for the produce in your orders" />
      {loading && <div className="flex items-center justify-center py-16 text-brand-400"><Loader2 className="w-6 h-6 animate-spin" /></div>}
      {error && <div className="card p-4 text-sm text-red-700 bg-red-50" role="alert">Could not load freshness: {error}</div>}
      {data && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="freshness-summary">
            {(['fresh', 'use_soon', 'urgent', 'expired'] as const).map((s) => (
              <div key={s} className="card p-4 flex items-center gap-3">
                <span className="w-3 h-10 rounded-full" style={{ background: TONE_HEX[s] }} />
                <div><p className="text-2xl font-extrabold text-brand-900">{n(s)}</p><p className="text-[11px] text-brand-600">{{ fresh: 'Fresh', use_soon: 'Use soon', urgent: 'Use now', expired: 'Past shelf life' }[s]} · in progress</p></div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-5">
            <div className="card p-4 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex rounded-xl bg-brand-50 p-1" role="tablist" aria-label="Order filter">
                  {FILTERS.map((f) => <button key={f.key} role="tab" aria-selected={filter === f.key} onClick={() => { setFilter(f.key); setSel(null); }} className={`px-3 py-1 rounded-lg text-xs font-semibold ${filter === f.key ? 'bg-white text-brand-800 shadow-sm' : 'text-brand-600'}`}>{f.label}</button>)}
                </div>
                <select value={product} onChange={(e) => { setProduct(e.target.value); setSel(null); }} aria-label="Filter by product" className="rounded-lg border border-brand-200 bg-white text-brand-800 text-xs px-2 py-1">
                  <option value="all">All produce</option>{products.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {shown.length === 0 ? <p className="text-sm text-brand-500 text-center py-8">{lines.length ? 'Nothing matches these filters.' : 'No orders yet. Freshness appears here once you order produce.'}</p> : (
                <ul className="space-y-2 max-h-[440px] overflow-y-auto pr-1" data-testid="freshness-lines">
                  {shown.map((l) => (
                    <li key={l.key}>
                      <button onClick={() => setSel(l.key)} className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition ${current?.key === l.key ? 'border-brand-400 bg-brand-50' : 'border-brand-100 hover:bg-brand-50/50'}`}>
                        <ShelfRing pct={l.f.pct_left} tone={l.f.state} size={54} label={l.f.days_left != null ? `${Math.max(0, l.f.days_left)}d` : '—'} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-brand-900 text-sm flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-brand-500" />{l.name} · {kg(l.kg)}</p>
                          <p className="text-[11px] text-brand-500 truncate">{l.order.order_id} · {l.order.progress?.label ?? l.order.status}</p>
                          <p className="text-[11px] font-semibold" style={{ color: TONE_HEX[l.f.state] }}>{l.f.label}{l.open ? '' : ' on delivery'}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-brand-300" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-5 lg:col-span-3" data-testid="freshness-detail">
              {!current ? <p className="text-sm text-brand-500">Select an order line to see its shelf-life timeline.</p> : (
                <>
                  <div className="flex flex-wrap items-start gap-4">
                    <ShelfRing pct={current.f.pct_left} tone={current.f.state} size={92} sub={current.f.days_left != null ? `${Math.max(0, current.f.days_left)}/${current.shelf} days` : ''} />
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-extrabold text-brand-900">{current.name} · {kg(current.kg)}</p>
                      <p className="text-xs text-brand-500">{current.order.order_id} · from {current.order.seller_name ?? 'farmer'} via {current.order.hub_name ?? current.order.hub_id}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
                        <span className="chip bg-brand-50 text-brand-700">{current.open ? 'Shelf life left today' : 'Shelf life left on the delivery day'}</span>
                        {current.temp && <span className="chip bg-sky-50 text-sky-700"><Thermometer className="w-3 h-3" /> Keep at {current.temp[0]}–{current.temp[1]} °C ({current.storage})</span>}
                        {!current.open && <span className="chip bg-brand-50 text-brand-700"><PackageCheck className="w-3 h-3" /> {current.order.delivery.fulfilment_label ?? 'Delivered'}</span>}
                      </div>
                    </div>
                  </div>
                  {current.harvest && current.shelf ? <div className="mt-4"><DecayCurve harvest={current.harvest} shelfDays={current.shelf} today={data.today} markers={current.markers} /></div>
                    : <p className="text-sm text-brand-500 mt-4">Harvest date not recorded for this listing.</p>}
                </>
              )}
              <p className="text-[11px] text-brand-500 flex gap-1.5 mt-3"><Info className="w-3.5 h-3.5 shrink-0" /> {data.freshness_basis} Today is {dateText(data.today)}.</p>
            </div>
          </div>

          {fm.length > 0 && (
            <div className="card p-5">
              <h3 className="font-display font-bold text-brand-800">Freshness of produce you received (history)</h3>
              <p className="text-xs text-brand-500 mb-3">Average hub QC score of the batches delivered to {data.buyer.name} each month, {dateText(data.deliveries.window.from)} – {dateText(data.deliveries.window.to)}</p>
              <LineChart labels={fm.map((m) => new Date(`${m.month}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }))} min={60} max={100}
                series={[{ name: 'Average QC score', color: '#16a34a', values: fm.map((m) => m.avg_qc_freshness) }]} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
