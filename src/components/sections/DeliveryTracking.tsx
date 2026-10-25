import { Truck, Clock, Loader2, Package, CheckCircle2, Info } from 'lucide-react';
import { useState } from 'react';
import { SectionHeader, Badge } from '@/components/ui';
import { useBuyerInsights, kg, pctText, dateText, isOpenOrder, type InsightOrder } from '@/lib/insights';
import type { BuyerScenarioState } from '@/components/CanonicalShipment';

const STEPS = [
  { stage: 'placed', label: 'Order placed' },
  { stage: 'approved', label: 'Approved by hub' },
  { stage: 'prepared', label: 'Prepared at hub' },
  { stage: 'dispatched', label: 'Driver assigned' },
  { stage: 'in_transit', label: 'Out for delivery' },
  { stage: 'delivered', label: 'Delivered' },
];
const stepIndex = (o: InsightOrder) => {
  const s = o.progress?.stage ?? o.status;
  if (['delivered', 'closed_short', 'partial', 'redelivery_planned', 'partial_awaiting_decision', 'failed_awaiting_decision'].includes(s)) return 5;
  return Math.max(0, STEPS.findIndex((x) => x.stage === s));
};
const tone = (o: InsightOrder): 'green' | 'amber' | 'blue' | 'red' | 'gray' =>
  ['rejected', 'cancelled'].includes(o.status) ? 'red' : o.progress?.stage === 'delivered' ? 'green' : ['in_transit', 'dispatched'].includes(o.progress?.stage ?? '') ? 'blue' : 'amber';

// scenarioState is kept for the App's props; tracking now reads this buyer's own orders.
export default function DeliveryTracking(_props: { scenarioState?: BuyerScenarioState }) {
  const { data, error, loading } = useBuyerInsights();
  const [sel, setSel] = useState<string | null>(null);
  const orders = data?.live.orders ?? [];
  const open = orders.filter(isOpenOrder);
  const current = orders.find((o) => o.order_id === sel) ?? open[0] ?? orders[0] ?? null;
  const k = data?.deliveries.kpis;

  return (
    <section>
      <SectionHeader title="Delivery Tracking" subtitle="Where your orders are now, and how past deliveries went" />
      {loading && <div className="flex items-center justify-center py-20 text-brand-400"><Loader2 className="w-6 h-6 animate-spin" /></div>}
      {error && <div className="card p-4 text-sm text-red-700 bg-red-50" role="alert">Could not load deliveries: {error}</div>}
      {data && (
        <div className="space-y-5">
          <div className="grid lg:grid-cols-5 gap-5">
            <div className="card p-4 lg:col-span-2">
              <h3 className="font-display font-bold text-brand-800 mb-3">Your orders ({open.length} in progress)</h3>
              {orders.length === 0 ? <p className="text-sm text-brand-500 py-6 text-center">No orders placed in the portal yet. Use Browse Produce to order.</p> : (
                <ul className="space-y-2 max-h-[420px] overflow-y-auto" data-testid="tracking-orders">
                  {orders.map((o) => (
                    <li key={o.order_id}>
                      <button onClick={() => setSel(o.order_id)} className={`w-full text-left rounded-xl p-3 border transition ${current?.order_id === o.order_id ? 'border-brand-400 bg-brand-50' : 'border-brand-100 hover:bg-brand-50/50'}`}>
                        <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-bold text-brand-800">{o.order_id}</span><Badge tone={tone(o)}>{o.progress?.label ?? o.status}</Badge></div>
                        <p className="text-xs text-brand-600 mt-1">{o.lines.map((l) => l.product_name).join(', ')} · {kg(o.total_kg)} · from {o.seller_name ?? 'farmer'}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-5 lg:col-span-3" data-testid="tracking-detail">
              {!current ? <p className="text-sm text-brand-500">Select an order.</p> : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div><p className="font-display font-bold text-brand-900">{current.order_id}</p><p className="text-xs text-brand-500">via {current.hub_name ?? current.hub_id} · placed {dateText(current.created_at, true)}</p></div>
                    <Badge tone={tone(current)}>{current.progress?.label ?? current.status}</Badge>
                  </div>
                  {['rejected', 'cancelled'].includes(current.status) ? <p className="text-sm text-red-600">This order was {current.status}.</p> : (
                    <ol className="flex items-start gap-1 mb-5">
                      {STEPS.map((s, i) => {
                        const done = i <= stepIndex(current);
                        return (
                          <li key={s.stage} className="flex-1 text-center">
                            <div className={`h-1.5 rounded-full ${done ? 'bg-brand-500' : 'bg-brand-100'}`} />
                            <p className={`text-[10px] mt-1 ${done ? 'text-brand-800 font-semibold' : 'text-brand-400'}`}>{s.label}</p>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <Info2 icon={Truck} label="Driver and vehicle" value={current.delivery.driver_name ? `${current.delivery.driver_name} · ${current.delivery.vehicle_id}` : 'Not assigned yet'} />
                    <Info2 icon={Clock} label="Estimated arrival" value={current.delivery.eta_at ? dateText(current.delivery.eta_at, true) : current.delivery.delivered_at ? `Delivered ${dateText(current.delivery.delivered_at, true)}` : 'Shown once a driver is assigned'} />
                    <Info2 icon={Package} label="Quantity" value={current.delivery.delivered_kg != null ? `${kg(current.delivery.delivered_kg)} delivered of ${kg(current.total_kg)}` : kg(current.total_kg)} />
                    <Info2 icon={CheckCircle2} label="Proof of delivery" value={current.delivery.fulfilment_label ? `${current.delivery.fulfilment_label}${current.delivery.produce_condition ? ` · condition ${current.delivery.produce_condition}` : ''}` : 'Not delivered yet'} />
                  </div>
                  <p className="text-[11px] text-brand-500 mt-3">Live GPS is not connected; the arrival estimate comes from the dispatch plan.</p>
                </>
              )}
            </div>
          </div>

          {k && (
            <div className="card p-5 overflow-x-auto">
              <h3 className="font-display font-bold text-brand-800">Delivery history</h3>
              <p className="text-xs text-brand-500 mb-3">{k.deliveries} deliveries to {data.buyer.name}, {dateText(data.deliveries.window.from)} – {dateText(data.deliveries.window.to)} (FarmXpress dataset)</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" data-testid="delivery-kpis">
                {[['On time (failed or rejected = missed)', pctText(k.on_time_pct)], ['Delivered', kg(k.delivered_kg)], ['Rejected on arrival', `${kg(k.rejected_kg)} (${pctText(k.rejection_rate_pct)})`], ['Avg freshness at hub QC', k.avg_qc_freshness_received ?? '-']].map(([a, b]) => (
                  <div key={a} className="rounded-xl bg-brand-50 p-3"><p className="text-[11px] text-brand-500">{a}</p><p className="font-bold text-brand-900">{b}</p></div>
                ))}
              </div>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-brand-500"><th className="py-1.5">Delivered</th><th>Order</th><th>Shipment</th><th>Driver</th><th className="text-right">Kg</th><th className="text-right">Rejected</th><th className="text-right">On time</th></tr></thead>
                <tbody>
                  {data.deliveries.recent.map((d) => (
                    <tr key={d.delivery_id} className="border-t border-brand-50">
                      <td className="py-1.5 text-xs">{dateText(d.completed_at, true)}</td><td className="font-mono text-xs">{d.order_id}</td><td className="font-mono text-xs">{d.shipment_id}</td>
                      <td className="text-xs">{d.driver_name ?? d.driver_id}</td><td className="text-right">{d.delivered_kg}</td>
                      <td className="text-right text-xs">{d.rejected_kg ? `${d.rejected_kg}${d.rejection_reason ? ` (${d.rejection_reason.replace(/_/g, ' ')})` : ''}` : '-'}</td>
                      <td className="text-right">{d.on_time == null ? '-' : d.on_time ? 'Yes' : d.status === 'failed' || d.status === 'rejected' ? `No (${d.status})` : `No${d.delay_minutes ? ` (+${d.delay_minutes} min)` : ''}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11px] text-brand-500 mt-3 flex gap-1.5"><Info className="w-3.5 h-3.5 shrink-0" /> On time = delivered or partially delivered by the requested time. Failed or rejected deliveries count as missed (same rule as FarmXpress KPI K01).</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Info2({ icon: Icon, label, value }: { icon: typeof Truck; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-50 p-3 flex gap-2.5">
      <Icon className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
      <div><p className="text-[11px] text-brand-500">{label}</p><p className="font-semibold text-brand-900 text-sm">{value}</p></div>
    </div>
  );
}
