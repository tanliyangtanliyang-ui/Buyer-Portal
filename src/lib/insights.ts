// Buyer insights from the FarmXpress API (GET /v1/buyers/{id}/insights): suppliers, delivery history (dataset, Jan-Jun 2026)
// and this buyer's live orders with tracking and shelf-life freshness. Shared by Dashboard, Suppliers, Tracking and Freshness.
import { useCallback, useEffect, useState } from 'react';
import { api, errText, BUYER_ID } from './liveApi';

export type ShelfLife = { days_since_harvest: number | null; days_left: number | null; pct_left: number | null; state: 'fresh' | 'use_soon' | 'urgent' | 'expired' | 'unknown'; label: string };
export type Supplier = { farmer_id: string; name: string; place: string | null; orders: number; allocated_kg: number; delivered_kg: number; avg_qc_freshness: number | null;
  avg_harvest_freshness: number | null; last_order_at: string | null; products: string[]; fill_rate_pct: number | null; qc_pass_rate_pct: number | null; live_orders: number; live_kg: number };
export type InsightOrder = {
  order_id: string; seller_name: string | null; hub_id: string; hub_name: string | null; status: string; progress: { stage: string; label: string } | null; total_kg: number;
  subtotal_sen: number; created_at: string; requested_delivery_by: string | null;
  delivery: { status: string; shipment_id: string | null; driver_name: string | null; vehicle_id: string | null; eta_at: string | null; delivered_kg: number | null; outstanding_kg: number | null;
    fulfilment_label: string | null; delivered_at: string | null; produce_condition: string | null };
  events: { from_status: string | null; to_status: string; actor_role: string; actor_id: string; at: string }[];
  lines: { listing_id: string; product_name: string | null; storage_class: string | null; temp_range_c: [number, number] | null; quantity_kg: number; harvest_date: string | null; shelf_life_days: number | null; freshness: ShelfLife; freshness_at_delivery: ShelfLife | null }[];
};
export type BuyerInsights = {
  buyer: { buyer_id: string; name: string; type: string; state: string; primary_hub_id: string | null };
  today: string;
  suppliers: Supplier[]; supplier_basis: string;
  deliveries: {
    kpis: { deliveries: number; delivered_kg: number; rejected_kg: number; on_time_pct: number | null; rejection_rate_pct: number | null; avg_qc_freshness_received: number | null };
    window: { from: string | null; to: string | null };
    freshness_monthly?: { month: string; avg_qc_freshness: number | null; deliveries: number }[];
    order_status: { status: string; n: number }[];
    recent: { delivery_id: string; order_id: string; shipment_id: string; completed_at: string; delivered_kg: number; rejected_kg: number; rejection_reason: string | null; on_time: number | null;
      status: string; vehicle_id: string; driver_id: string; driver_name: string | null; delay_minutes: number | null }[];
    rejection_reasons: { reason: string; n: number; kg: number }[];
  };
  live: { orders: InsightOrder[]; totals: { orders: number; open: number; kg: number; delivered_kg: number; value_sen: number } };
  freshness_basis: string;
};

let inflight: { at: number; p: Promise<BuyerInsights> } | null = null;
function fetchInsights() {
  if (!inflight || Date.now() - inflight.at > 3000) inflight = { at: Date.now(), p: api<BuyerInsights>(`/buyers/${BUYER_ID}/insights`) };
  return inflight.p;
}
/** Loads the buyer's insights and refreshes every 20 s (orders move as the hub and driver act). */
export function useBuyerInsights() {
  const [data, setData] = useState<BuyerInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => fetchInsights().then((d) => { setData(d); setError(null); }).catch((e) => setError(errText(e))), []);
  useEffect(() => { load(); const t = setInterval(load, 20_000); return () => clearInterval(t); }, [load]);
  return { data, error, loading: !data && !error };
}

export const kg = (n: number | null | undefined) => (n == null ? '-' : `${Number(n).toLocaleString('en-MY')} kg`);
export const pctText = (v: number | null | undefined) => (v == null ? '-' : `${v}%`);
export const dateText = (iso: string | null | undefined, time = false) => (iso ? new Date(iso.length === 10 ? `${iso}T00:00:00+08:00` : iso).toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit' } : {}), timeZone: 'Asia/Kuala_Lumpur' }) : '-');
export const shelfTone = (s: ShelfLife['state']) => ({ fresh: 'bg-brand-100 text-brand-700', use_soon: 'bg-amber-100 text-amber-700', urgent: 'bg-orange-100 text-orange-700', expired: 'bg-red-100 text-red-700', unknown: 'bg-gray-100 text-gray-500' }[s]);
export const shelfBar = (s: ShelfLife['state']) => ({ fresh: 'bg-brand-500', use_soon: 'bg-amber-400', urgent: 'bg-orange-500', expired: 'bg-red-500', unknown: 'bg-gray-300' }[s]);
export const isOpenOrder = (o: InsightOrder) => !['rejected', 'cancelled'].includes(o.status) && !['delivered', 'closed_short'].includes(o.progress?.stage ?? '');

// Bell notifications from this buyer's own order records (status changes and proof of delivery). Read state is kept in this browser.
export type OrderNote = { id: string; at: string; title: string; detail: string; tone: 'info' | 'success' | 'warning' };
const NOTE_LABEL: Record<string, [string, OrderNote['tone']]> = {
  placed: ['Order placed', 'info'], accepted: ['Approved by the hub', 'success'], rejected: ['Rejected by the hub', 'warning'],
  cancelled: ['Order cancelled', 'warning'], ready_for_pickup: ['Prepared at the hub for dispatch', 'info'],
};
const READ_KEY = 'fx.buyer.notifications.read';
export function useOrderNotifications() {
  const { data } = useBuyerInsights();
  const [read, setRead] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(READ_KEY) ?? '[]'); } catch { return []; } });
  const notes: OrderNote[] = [];
  for (const o of data?.live.orders ?? []) {
    for (const e of o.events) { const [t, tone] = NOTE_LABEL[e.to_status] ?? [e.to_status, 'info']; notes.push({ id: `${o.order_id}:${e.to_status}:${e.at}`, at: e.at, title: `${o.order_id}: ${t}`, detail: `${o.lines.map((l) => l.product_name).join(', ')} · ${kg(o.total_kg)} from ${o.seller_name ?? 'farmer'}`, tone }); }
    if (o.delivery.delivered_at) notes.push({ id: `${o.order_id}:delivered`, at: o.delivery.delivered_at, title: `${o.order_id}: ${o.delivery.fulfilment_label ?? 'Delivered'}`, detail: `Proof of delivery recorded${o.delivery.produce_condition ? ` · condition ${o.delivery.produce_condition}` : ''}`, tone: 'success' });
  }
  notes.sort((a, b) => b.at.localeCompare(a.at));
  const markAllRead = () => { const ids = [...new Set([...read, ...notes.map((n) => n.id)])].slice(-500); setRead(ids); try { localStorage.setItem(READ_KEY, JSON.stringify(ids)); } catch { /* convenience only */ } };
  return { notes: notes.slice(0, 30), unread: notes.filter((n) => !read.includes(n.id)).length, isRead: (id: string) => read.includes(id), markAllRead };
}
