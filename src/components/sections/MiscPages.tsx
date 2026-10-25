import { useLiveData, useLiveSingle } from '@/lib/useLiveData';
import { useCallback, useEffect, useState } from 'react';
import { api, BUYER_ID, errText, loadBuyerProfile, initials, type BuyerProfile, type LiveOrder, type OrderStatus } from '@/lib/liveApi';
import { FreshnessMeter, Badge, SectionHeader, ProgressBar } from '@/components/ui';
import { Search, Filter, Package, AlertTriangle, Loader2 } from 'lucide-react';
import { BUYER_CODE } from '@/lib/local';
import type { Order, Buyer, Batch } from '@/lib/types';

// My Orders: buyer orders saved through the FarmXpress API (POST /v1/live/orders). Status changes are
// recorded by the API; nothing here is kept only in component state.
const ORDER_STATUS: Record<OrderStatus, { label: string; tone: 'green' | 'amber' | 'blue' | 'red' | 'gray' }> = {
  placed: { label: 'Placed · awaiting hub review', tone: 'amber' },
  accepted: { label: 'Approved by hub', tone: 'blue' },
  ready_for_pickup: { label: 'Prepared · ready for dispatch', tone: 'green' },
  rejected: { label: 'Rejected by hub', tone: 'red' },
  cancelled: { label: 'Cancelled', tone: 'gray' },
};

// One badge for where the order is now; delivered orders no longer show "Approved by hub" (scenario finding 3).
function progressTone(o: LiveOrder): 'green' | 'amber' | 'blue' | 'red' | 'gray' {
  const st = o.progress?.stage;
  if (!st) return ORDER_STATUS[o.status].tone;
  if (st === 'delivered') return 'green';
  if (st === 'rejected') return 'red';
  if (st === 'cancelled') return 'gray';
  if (['partial_awaiting_decision', 'failed_awaiting_decision', 'closed_short', 'partial', 'redelivery_planned', 'placed'].includes(st)) return 'amber';
  return 'blue';
}

export function OrdersPage() {
  const [orders, setOrders] = useState<LiveOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | OrderStatus>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const load = useCallback(() => {
    setError(null);
    api<{ orders: LiveOrder[] }>(`/live/orders?buyer=${BUYER_ID}`).then((r) => setOrders(r.orders)).catch((e) => { setOrders(null); setError(errText(e)); });
  }, []);
  useEffect(() => { load(); }, [load]);
  // Pick up hub decisions without a manual reload (keeps the last list if a poll fails).
  useEffect(() => {
    const t = setInterval(() => { api<{ orders: LiveOrder[] }>(`/live/orders?buyer=${BUYER_ID}`).then((r) => setOrders(r.orders)).catch(() => undefined); }, 20_000);
    return () => clearInterval(t);
  }, []);
  const cancel = async (o: LiveOrder) => {
    setBusy(o.order_id); setActionError(null);
    try { await api(`/live/orders/${o.order_id}/transition`, { role: 'buyer', actor_id: BUYER_ID, to: 'cancelled' }); }
    catch (e) { setActionError(`${o.order_id}: ${errText(e)}`); }
    finally { setBusy(null); load(); }
  };
  const q = query.trim().toLowerCase();
  const shown = (orders ?? []).filter((o) => (status === 'all' || o.status === status) && (!q || `${o.order_id} ${o.seller_name} ${o.lines.map((l) => l.product_name).join(' ')}`.toLowerCase().includes(q)));

  return (
    <div className="space-y-6">
      <SectionHeader title="My Orders" subtitle={`Orders placed by buyer ${BUYER_ID}, saved in the FarmXpress API`} />
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-brand-50">
          <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 flex-1 min-w-[180px] max-w-xs">
            <Search className="w-4 h-4 text-brand-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search orders…" aria-label="Search orders" className="bg-transparent outline-none text-sm w-full text-brand-800 placeholder:text-brand-400" />
          </div>
          <label className="flex items-center gap-1.5 rounded-xl bg-white border border-brand-100 px-3 py-2 text-sm font-semibold text-brand-600">
            <Filter className="w-4 h-4" />
            <select value={status} onChange={(e) => setStatus(e.target.value as 'all' | OrderStatus)} className="bg-transparent outline-none" aria-label="Filter by status">
              <option value="all">All statuses</option>
              {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}
            </select>
          </label>
          <button type="button" onClick={load} className="rounded-xl bg-white border border-brand-100 px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50">Refresh</button>
        </div>
        {error && <div role="alert" className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Orders could not be loaded: {error}. <button type="button" onClick={load} className="underline font-semibold">Retry</button></div>}
        {actionError && <div role="alert" className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Could not cancel {actionError}</div>}
        {orders === null && !error ? (
          <div className="flex items-center justify-center py-16 text-brand-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : orders !== null && shown.length === 0 ? (
          <p className="p-6 text-sm text-brand-600">{orders.length === 0 ? 'No orders yet. Place one from Browse Produce.' : 'No orders match this search.'}</p>
        ) : orders !== null && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-brand-500 font-semibold uppercase tracking-wide bg-brand-50/50">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Farmer · Hub</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((o) => (
                  <tr key={o.order_id} className="border-t border-brand-50 hover:bg-brand-50/40 transition align-top" data-order-id={o.order_id}>
                    <td className="px-4 py-3 font-bold text-brand-700 font-mono">{o.order_id}</td>
                    <td className="px-4 py-3 font-semibold text-brand-800">{o.lines.map((l) => l.product_name).join(', ')}</td>
                    <td className="px-4 py-3 text-brand-600">{o.total_kg} kg</td>
                    <td className="px-4 py-3 text-brand-500">{o.created_at.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-brand-600">{o.seller_name} <span className="font-mono text-xs">({o.seller_farmer_id})</span><br /><span className="text-xs">{o.hub_name}</span></td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-800">RM {(o.subtotal_sen / 100).toFixed(2)}</td>
                    <td className="px-4 py-3"><Badge tone={progressTone(o)}>{o.progress?.label ?? ORDER_STATUS[o.status].label}</Badge>
                      {o.status === 'rejected' && <p className="mt-1 text-[11px] text-red-600">Reason: {o.decision_reason ?? 'not given'}</p>}
                      {o.delivery.fulfilment && (
                        <div className="mt-1 text-[11px]" data-testid={`buyer-delivery-${o.order_id}`}>
                          <p className={`font-semibold ${o.delivery.fulfilment.outstanding_qty ? 'text-red-600' : 'text-brand-700'}`}>{o.delivery.fulfilment.status_label} ({o.delivery.fulfilment.delivered_qty} of {o.delivery.fulfilment.delivered_qty + o.delivery.fulfilment.outstanding_qty} kg)</p>
                          {o.delivery.fulfilment.pods.map((p) => <p key={p.pod_id} className="text-brand-500">{p.pod_id}: {p.outcome} · {p.delivered_qty} kg · {new Date(p.delivered_at).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}{p.recipient_name ? ` · received by ${p.recipient_name}` : ''}{p.reason_label ? ` · ${p.reason_label}` : ''} · condition {p.produce_condition.replace(/_/g, ' ')}{p.decision?.status === 'resolved' ? ` · hub: ${p.decision.resolution === 'redeliver' ? 're-delivery planned' : 'closed without re-delivery'} (${p.decision.note})` : p.decision ? ' · awaiting hub decision' : ''}</p>)}
                        </div>
                      )}
                      <p className="mt-1 text-[11px] text-brand-500">{o.delivery.fulfilment && (o.delivery.status !== 'dispatched' && o.delivery.status !== 'in_transit') ? '' : o.delivery.shipment_id
                        ? `${o.delivery.status === 'in_transit' ? 'In transit' : 'Dispatched'} on ${o.delivery.shipment_id} · driver ${o.delivery.driver_name ?? o.delivery.driver_id} · ${o.delivery.vehicle_id}${o.delivery.eta_at ? ` · estimated arrival ${new Date(o.delivery.eta_at).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}` : ''}`
                        : o.delivery.status === 'awaiting_hub_allocation' ? 'Awaiting dispatch (no shipment yet)' : o.delivery.status === 'not_required' ? 'No delivery' : 'Delivery not scheduled yet'}</p></td>
                    <td className="px-4 py-3">{o.status === 'placed' && <button type="button" disabled={busy === o.order_id} onClick={() => cancel(o)} className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">{busy === o.order_id ? 'Cancelling…' : 'Cancel'}</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function InventoryPage() {
  const { data: batches, loading } = useLiveData<Batch>('batches', '*');
  // Derive inventory from batch availability
  const inventory = batches?.map((b) => ({
    item: b.product,
    stock: b.available_kg,
    reorder: Math.round(b.available_kg * 0.3),
    status: b.available_kg < 150 ? 'Critical' : b.available_kg < 400 ? 'Low' : 'OK',
    code: b.code,
  })) ?? [];

  return (
    <div className="space-y-6">
      <SectionHeader title="Inventory Planning" subtitle="Monitor stock levels and plan reorders — synced with batch availability" />
      {loading ? (
        <div className="flex items-center justify-center py-20 text-brand-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {inventory.map((item, i) => {
            const pct = Math.min(100, (item.stock / (item.reorder * 2)) * 100);
            const tone = item.status === 'Critical' ? 'bg-red-500' : item.status === 'Low' ? 'bg-amber-500' : 'bg-brand-500';
            return (
              <div key={item.code} className="card p-5 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                    <Package className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-brand-800">{item.item}</p>
                    <p className="text-[11px] text-brand-500 font-mono">{item.code}</p>
                  </div>
                  {item.status === 'Critical' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-brand-600">{item.stock} kg in stock</span>
                  <span className="text-xs text-brand-500">Reorder at {item.reorder} kg</span>
                </div>
                <ProgressBar value={pct} tone={tone} />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-brand-500">{Math.round(pct)}% capacity</span>
                  <Badge tone={item.status === 'Critical' ? 'red' : item.status === 'Low' ? 'amber' : 'green'}>{item.status}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ReportsPage() {
  const { data: buyer } = useLiveSingle<Buyer>('buyers', '*', { code: BUYER_CODE });
  const { data: orders, loading } = useLiveData<Order>(
    'orders',
    '*',
    (q: any) => (buyer ? q.eq('buyer_id', buyer.id) : q)
  );

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const data = [5200, 6100, 5800, 6900, 7300, 7600, orders?.reduce((s, o) => s + o.quantity_kg, 0) ?? 8450];
  const max = Math.max(...data);
  const totalOrders = orders?.length ?? 0;
  const totalValue = orders?.reduce((s, o) => s + (o.price_per_kg ?? 0) * o.quantity_kg, 0) ?? 0;
  const delivered = orders?.filter((o) => o.status === 'Delivered').length ?? 0;
  const onTimeRate = totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 96;
  const avgFresh = orders && orders.length > 0 ? Math.round(orders.reduce((s, o) => s + o.freshness, 0) / orders.length) : 95;

  return (
    <div className="space-y-6">
      <SectionHeader title="Reports & Analytics" subtitle="Insights into your procurement performance — live data" />
      {loading ? (
        <div className="flex items-center justify-center py-20 text-brand-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="card p-5 lg:col-span-2">
            <h3 className="font-display font-bold text-brand-800 mb-4">Purchase Volume Trend</h3>
            <div className="flex items-end justify-between gap-3 h-48">
              {data.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center h-40">
                    <div className="w-8 rounded-t-xl bg-gradient-to-t from-brand-600 to-brand-400 bar-grow" style={{ height: `${(v / max) * 100}%`, animationDelay: `${i * 70}ms` }} />
                  </div>
                  <span className="text-xs font-semibold text-brand-500">{months[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-display font-bold text-brand-800 mb-4">Key Metrics</h3>
            {[
              { l: 'Total Orders', v: String(totalOrders), t: 'live' },
              { l: 'Total Value', v: `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, t: 'live' },
              { l: 'On-time Rate', v: `${onTimeRate}%`, t: `${delivered} delivered` },
              { l: 'Avg Freshness', v: `${avgFresh}%`, t: 'across orders' },
            ].map((m) => (
              <div key={m.l} className="flex items-center justify-between py-3 border-b border-brand-50 last:border-0">
                <span className="text-sm text-brand-600 font-semibold">{m.l}</span>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-800">{m.v}</p>
                  <p className="text-[11px] text-brand-500">{m.t}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SettingsPage() {
  const [buyer, setBuyer] = useState<BuyerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { loadBuyerProfile().then((b) => { setBuyer(b); setLoading(false); }); }, []);
  const notRecorded = 'Not recorded in the FarmXpress dataset';
  return (
    <div className="space-y-6">
      <SectionHeader title="Account Settings" subtitle="Your buyer profile as recorded in FarmXpress" />
      <div className="card p-6 max-w-2xl" data-testid="buyer-settings">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-brand-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl font-extrabold">
                {initials(buyer?.name)}
              </div>
              <div>
                <h3 className="font-display font-bold text-brand-900">{buyer?.name ?? BUYER_ID}</h3>
                <p className="text-sm text-brand-500">{buyer?.type ?? 'Buyer'} · <span className="font-mono">{BUYER_ID}</span></p>
              </div>
            </div>
            {!buyer && <p role="alert" className="mb-4 text-sm text-red-600">Buyer profile could not be loaded from the FarmXpress API.</p>}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { l: 'Business name', v: buyer?.name ?? '—' },
                { l: 'Buyer type', v: buyer?.type ?? '—' },
                { l: 'State', v: buyer?.state ?? '—' },
                { l: 'Usual hub', v: buyer?.primary_hub_id ?? '—' },
                { l: 'Contact person', v: notRecorded },
                { l: 'Email / phone', v: notRecorded },
              ].map((f) => (
                <div key={f.l}>
                  <label className="text-xs font-semibold text-brand-500 uppercase tracking-wide">{f.l}</label>
                  <input value={f.v} readOnly aria-readonly="true" className="mt-1 w-full rounded-xl bg-brand-50/50 border border-brand-100 px-3 py-2.5 text-sm font-semibold text-brand-800 outline-none" />
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-brand-500">Account details come from the FarmXpress dataset and are read-only in this prototype.</p>
          </>
        )}
      </div>
    </div>
  );
}
