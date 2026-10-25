import { MapPin, Clock, Package, Truck, Plus, Loader2, Check, Snowflake, Warehouse, RefreshCw, AlertTriangle } from 'lucide-react';
import { FreshnessMeter, SectionHeader, Badge } from '@/components/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, BUYER_ID, errText, newKey, rm, type Listing, type LiveOrder } from '@/lib/liveApi';

type CardResult = { tone: 'ok'; order: LiveOrder } | { tone: 'error'; text: string };

// Browse Produce: real hub stock from the FarmXpress API (dataset batches marked available, plus farmer
// produce received at a hub). Orders persist via POST /v1/live/orders and reserve stock atomically.
export default function ProduceMarketplace({ limit, onViewOrders }: { limit?: number; onViewOrders?: () => void }) {
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState('all');
  const [hub, setHub] = useState('all');
  const [qty, setQty] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CardResult>>({});
  const [keys, setKeys] = useState<Record<string, string>>({});

  const [hidden, setHidden] = useState(0);
  const load = useCallback(() => {
    setError(null);
    api<{ listings: Listing[]; hidden_past_shelf_life?: number }>('/live/listings').then((r) => { setListings(r.listings); setHidden(r.hidden_past_shelf_life ?? 0); }).catch((e) => { setListings(null); setError(errText(e)); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const products = useMemo(() => [...new Map((listings ?? []).map((l) => [l.product_id, l.product_name ?? l.product_id])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [listings]);
  const hubs = useMemo(() => [...new Map((listings ?? []).map((l) => [l.hub_id, l.hub_name ?? l.hub_id])).entries()], [listings]);
  const visible = (listings ?? []).filter((l) => (product === 'all' || l.product_id === product) && (hub === 'all' || l.hub_id === hub));
  const shown = limit ? visible.slice(0, limit) : visible;

  const order = async (l: Listing) => {
    const n = Number(qty[l.listing_id]);
    if (!Number.isInteger(n) || n < 1 || n > l.available_kg || busy) return;
    // One idempotency key per attempt on this card: a double click or retry can never create two orders.
    const key = keys[l.listing_id] ?? newKey();
    setKeys((k) => ({ ...k, [l.listing_id]: key }));
    setBusy(l.listing_id);
    try {
      const out = await api<{ orders: LiveOrder[] }>('/live/orders', { buyer_id: BUYER_ID, idempotency_key: key, delivery_preference: l.storage_class === 'chilled' ? 'refrigerated' : 'no_preference', lines: [{ listing_id: l.listing_id, quantity_kg: n }] });
      setResults((r) => ({ ...r, [l.listing_id]: { tone: 'ok', order: out.orders[0] } }));
      setQty((q) => ({ ...q, [l.listing_id]: '' }));
      setKeys((k) => { const next = { ...k }; delete next[l.listing_id]; return next; });
      load();
    } catch (e) {
      setResults((r) => ({ ...r, [l.listing_id]: { tone: 'error', text: errText(e) } }));
      setKeys((k) => { const next = { ...k }; delete next[l.listing_id]; return next; });
      load();
    } finally { setBusy(null); }
  };

  return (
    <section>
      <SectionHeader
        title="Fresh Produce Marketplace"
        subtitle={`Available stock at FarmXpress consolidation hubs${listings ? ` · ${visible.length} listing${visible.length === 1 ? '' : 's'}` : ''}`}
        action={
          <div className="flex flex-wrap gap-2">
            <select value={product} onChange={(e) => setProduct(e.target.value)} aria-label="Filter by produce" className="rounded-xl border border-brand-100 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700">
              <option value="all">All produce</option>
              {products.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <select value={hub} onChange={(e) => setHub(e.target.value)} aria-label="Filter by hub" className="rounded-xl border border-brand-100 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700">
              <option value="all">All hubs</option>
              {hubs.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <button type="button" onClick={load} className="rounded-xl border border-brand-100 bg-white px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 flex items-center gap-1"><RefreshCw className="w-3 h-3" />Refresh</button>
          </div>
        }
      />
      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Produce listings could not be loaded: {error}. No sample produce is shown in their place. <button type="button" onClick={load} className="underline font-semibold">Retry</button></span>
        </div>
      )}
      {listings === null && !error && (
        <div className="flex items-center justify-center py-20 text-brand-400" role="status"><Loader2 className="w-6 h-6 animate-spin" /><span className="sr-only">Loading produce</span></div>
      )}
      {hidden > 0 && <p className="mb-3 text-xs text-brand-600" data-testid="hidden-past-shelf-life">{hidden} listing{hidden === 1 ? ' is' : 's are'} past shelf life and not offered for sale.</p>}
      {listings !== null && visible.length === 0 && (
        <div className="rounded-2xl border border-brand-100 bg-white p-6 text-sm text-brand-600">No produce is available{product !== 'all' || hub !== 'all' ? ' for these filters' : ' right now'}. Hub stock appears here once a farmer's delivery is received at a hub.</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {shown.map((p) => {
          const n = Number(qty[p.listing_id]);
          const valid = Number.isInteger(n) && n >= 1 && n <= p.available_kg;
          const result = results[p.listing_id];
          return (
            <div key={p.listing_id} className="card overflow-hidden hover:shadow-pop transition-all duration-300" data-listing-id={p.listing_id}>
              <div className="relative h-28 bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white">
                <div className="flex items-start justify-between gap-2">
                  <Badge tone={p.storage_class === 'chilled' ? 'blue' : 'green'}>{p.storage_class === 'chilled' && <Snowflake className="w-3 h-3" />}{p.storage_class ?? 'storage n/a'}</Badge>
                  <span className="bg-white/90 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold text-brand-700">{p.listing_id}</span>
                </div>
                <h3 className="font-display text-xl font-bold mt-3 leading-tight">{p.product_name ?? p.product_id}</h3>
                <p className="text-xs text-brand-50/90">{p.seller_name ?? 'Unknown farmer'} <span className="font-mono">({p.seller_farmer_id})</span></p>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <p className="text-xs text-brand-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{p.farm ? `${p.farm.name}, ${p.farm.state}` : 'Farm not recorded'}</p>
                  <p className="font-display font-extrabold text-brand-700" title={p.price_basis}>{rm(p.price_sen_per_kg)}<span className="text-[10px] text-brand-400 font-medium">/kg</span></p>
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  <Row icon={Clock} label="Harvested" value={p.harvest_at ? `${p.harvest_at.slice(0, 10)}${p.days_of_shelf_life_left != null ? ` · ${p.days_of_shelf_life_left} of ${p.shelf_life_days} days shelf life left` : ''}` : 'not recorded'} />
                  <Row icon={Package} label="Available" value={`${p.available_kg} kg`} />
                  <Row icon={Warehouse} label="At hub" value={p.hub_name ?? p.hub_id} />
                  <Row icon={Truck} label="Shelf life" value={p.shelf_life_days ? `${p.shelf_life_days} days` : 'not recorded'} />
                </div>
                <div className="mt-3">
                  {p.freshness_score_at_harvest !== null
                    ? <FreshnessMeter value={p.freshness_score_at_harvest} label="Freshness score at harvest (dataset)" />
                    : <p className="text-[11px] text-brand-500">Freshness score at harvest: not recorded for farmer-registered produce</p>}
                </div>
                <p className="mt-2 text-[10px] text-brand-400">Price: dataset reference price · {p.source_type === 'dataset_batch' ? `batch ${p.source_id}` : `received via ${p.source_id}`}</p>
                <div className="mt-3 flex gap-2">
                  <input type="number" min={1} max={p.available_kg} step={1} inputMode="numeric" value={qty[p.listing_id] ?? ''} onChange={(e) => setQty((q) => ({ ...q, [p.listing_id]: e.target.value }))}
                    placeholder="kg" aria-label={`Quantity of ${p.product_name} in kg`} className="w-24 rounded-xl border border-brand-100 px-3 py-2 text-sm text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500/40" />
                  <button onClick={() => order(p)} disabled={!valid || busy === p.listing_id}
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                    {busy === p.listing_id ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing order…</> : <><Plus className="w-4 h-4" /> Place order</>}
                  </button>
                </div>
                {qty[p.listing_id] && !valid && <p className="mt-1 text-[11px] text-amber-700">Enter a whole number from 1 to {p.available_kg} kg.</p>}
                {result?.tone === 'ok' && (
                  <p className="mt-2 text-xs text-brand-700 flex items-start gap-1" role="status"><Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>Order <span className="font-mono font-bold">{result.order.order_id}</span> saved: {result.order.total_kg} kg, {rm(result.order.subtotal_sen)}, status placed.{onViewOrders && <> <button type="button" className="underline font-semibold" onClick={onViewOrders}>View in My Orders</button></>}</span></p>
                )}
                {result?.tone === 'error' && <p className="mt-2 text-xs text-red-700" role="alert">Order not placed: {result.text}</p>}
              </div>
            </div>
          );
        })}
      </div>
      {limit && visible.length > limit && <p className="mt-4 text-sm text-brand-600">Showing {limit} of {visible.length} listings. Open Browse Produce to see all.</p>}
    </section>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-brand-500 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </span>
      <span className="font-semibold text-brand-800">{value}</span>
    </div>
  );
}
