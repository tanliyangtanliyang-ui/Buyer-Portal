import { useEffect, useState } from 'react';

// Read-only buyer records from the shared FarmXpress API (GET /v1/buyers/{id}).
// Every value below is rendered from the API response; nothing is substituted on failure.
const API = import.meta.env.VITE_FARMXPRESS_API_BASE_URL ?? 'http://127.0.0.1:4000/v1';
const BUYER_ID = 'BYR-004';
const SHIPMENT_ID = 'SHP-000006';

type Order = { order_id: string; hub_id: string; status: string; placed_at: string | null; requested_delivery_by: string | null; total_value_sen: number | null; item_count: number; shipment_ids: string[] };
type BuyerResponse = {
  readOnly: boolean;
  buyer: { buyer_id: string; name: string; type: string | null; state: string; primary_hub_id: string | null };
  totals: { orders: number; ordersByStatus: Record<string, number>; deliveriesByStatus: Record<string, number> };
  orders: Order[];
  provenance: { dataset_version: string; label: string } | null;
};
type Load = { loading: boolean; data?: BuyerResponse; error?: string };

const utc = (s: string | null) => (s ? `${s.replace('T', ' ').slice(0, 16)} UTC` : 'not recorded');
const rm = (sen: number | null) => (sen === null ? 'value not recorded' : `RM ${(sen / 100).toFixed(2)}`);
const counts = (o: Record<string, number>) => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(' · ') || 'none';

function useBuyer(query: string): Load {
  const [state, setState] = useState<Load>({ loading: true });
  useEffect(() => {
    let active = true;
    fetch(`${API}/buyers/${BUYER_ID}${query}`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error(`API ${r.status}`))))
      .then((data: BuyerResponse) => { if (active) setState({ loading: false, data }); })
      .catch((e: Error) => { if (active) setState({ loading: false, error: e.message }); });
    return () => { active = false; };
  }, [query]);
  return state;
}

const OrderLine = ({ o }: { o: Order }) => (
  <div className="mt-1 font-mono text-xs">{o.order_id} · {o.status} · placed {utc(o.placed_at)} · {o.item_count} items · {rm(o.total_value_sen)} · hub {o.hub_id} · shipments {o.shipment_ids.length ? o.shipment_ids.join(', ') : 'none'}</div>
);

export function RoleRecordPanel() {
  const all = useBuyer('?limit=5');
  const inShipment = useBuyer(`?shipment=${SHIPMENT_ID}&limit=50`);

  if (all.error) return <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Buyer records unavailable from the shared API ({all.error}). No buyer data is shown in place of the API.</div>;
  if (all.loading || !all.data) return <div className="mb-8 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-700">Loading buyer {BUYER_ID} from the shared API…</div>;

  const { buyer, totals, orders, provenance } = all.data;
  return (
    <section className="mb-8 rounded-2xl border border-brand-200 bg-white p-4 text-sm text-gray-800" data-source="farmxpress-api">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <b>{buyer.name} <span className="font-mono text-xs">({buyer.buyer_id})</span></b>
        <span className="text-xs text-brand-700">Shared API · read-only · {provenance?.label ?? 'provenance not returned'} v{provenance?.dataset_version ?? '?'}</span>
      </div>
      <div className="mt-1 text-xs">{buyer.type ?? 'Type not recorded'} · {buyer.state} · primary hub {buyer.primary_hub_id ?? 'not recorded'}</div>
      <div className="mt-1 text-xs">Orders: {totals.orders} ({counts(totals.ordersByStatus)}) · Deliveries: {counts(totals.deliveriesByStatus)}</div>
      <div className="mt-3 text-xs font-semibold">Orders in demo shipment {SHIPMENT_ID}</div>
      {inShipment.error ? <div className="mt-1 text-xs text-red-700">Unavailable: {inShipment.error}</div>
        : inShipment.loading || !inShipment.data ? <div className="mt-1 text-xs">Loading…</div>
        : inShipment.data.orders.length === 0 ? <div className="mt-1 text-xs">The API returned no orders from {BUYER_ID} in {SHIPMENT_ID}.</div>
        : inShipment.data.orders.map((o) => <OrderLine key={o.order_id} o={o} />)}
      <div className="mt-3 text-xs font-semibold">Most recent orders</div>
      {orders.length === 0 ? <div className="mt-1 text-xs">No orders returned.</div> : orders.map((o) => <OrderLine key={o.order_id} o={o} />)}
      <div className="mt-2 text-xs text-gray-500">Marketplace listings and other cards below still use the portal's local demo data.</div>
    </section>
  );
}
