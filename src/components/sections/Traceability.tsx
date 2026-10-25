import { useState } from 'react';
import { SectionHeader } from '@/components/ui';
import { Loader2 } from 'lucide-react';
import { useBuyerInsights, kg, dateText, type InsightOrder } from '@/lib/insights';

// Farm-to-buyer trace of one of this buyer's orders, built only from recorded steps (no simulated stages).
function stages(o: InsightOrder) {
  const at = (to: string) => o.events.find((e) => e.to_status === to)?.at ?? null;
  const l = o.lines[0];
  return [
    { emoji: '🌱', title: 'Farm harvest', when: l?.harvest_date ?? null, rows: [['Supplier', o.seller_name ?? '-'], ['Produce', o.lines.map((x) => `${x.product_name} ${kg(x.quantity_kg)}`).join(', ')], ['Harvested', dateText(l?.harvest_date)]] },
    { emoji: '🏭', title: 'Consolidation hub', when: at('accepted'), rows: [['Hub', o.hub_name ?? o.hub_id], ['Order approved', at('accepted') ? dateText(at('accepted'), true) : 'Not yet'], ['Prepared', at('ready_for_pickup') ? dateText(at('ready_for_pickup'), true) : 'Not recorded']] },
    { emoji: '🚛', title: 'Transport', when: o.delivery.shipment_id ? 'x' : null, rows: [['Shipment', o.delivery.shipment_id ?? 'Not dispatched yet'], ['Driver', o.delivery.driver_name ?? '-'], ['Vehicle', o.delivery.vehicle_id ?? '-']] },
    { emoji: '🏪', title: 'Delivered to you', when: o.delivery.delivered_at, rows: [['Status', o.delivery.fulfilment_label ?? o.progress?.label ?? o.status], ['Delivered at', dateText(o.delivery.delivered_at, true)], ['Condition', o.delivery.produce_condition ?? '-']] },
  ];
}

export default function Traceability() {
  const { data, error, loading } = useBuyerInsights();
  const orders = (data?.live.orders ?? []).filter((o) => !['rejected', 'cancelled'].includes(o.status));
  const [sel, setSel] = useState<string | null>(null);
  const order = orders.find((o) => o.order_id === sel) ?? orders[0];

  return (
    <section>
      <SectionHeader title="Farm-to-Business Traceability" subtitle="Each recorded step of an order, from harvest to your door" />
      {loading && <div className="flex items-center justify-center py-12 text-brand-400"><Loader2 className="w-6 h-6 animate-spin" /></div>}
      {error && <div className="card p-4 text-sm text-red-700 bg-red-50" role="alert">Could not load traceability: {error}</div>}
      {data && !order && <div className="card p-6 text-sm text-brand-500 text-center">No orders to trace yet.</div>}
      {order && (
        <div className="card p-5" data-testid="traceability">
          <label className="text-xs text-brand-600 font-semibold">Order{' '}
            <select value={order.order_id} onChange={(e) => setSel(e.target.value)} className="ml-2 rounded-lg border border-brand-200 bg-white text-brand-900 px-2 py-1 text-sm">
              {orders.map((o) => <option key={o.order_id} value={o.order_id}>{o.order_id} · {o.lines.map((l) => l.product_name).join(', ')}</option>)}
            </select>
          </label>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {stages(order).map((s) => (
              <div key={s.title} className={`rounded-xl border p-3 ${s.when ? 'border-brand-200 bg-brand-50/60' : 'border-dashed border-brand-100 opacity-70'}`}>
                <p className="font-bold text-brand-900 text-sm">{s.emoji} {s.title}</p>
                <dl className="mt-2 space-y-1 text-xs">{s.rows.map(([a, b]) => <div key={a} className="flex justify-between gap-2"><dt className="text-brand-500">{a}</dt><dd className="font-semibold text-brand-800 text-right">{b}</dd></div>)}</dl>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-brand-500 mt-3">Steps without a record are shown dashed. QR/RFID scanning is not connected; crate labels are typed by the driver.</p>
        </div>
      )}
    </section>
  );
}
