// Client for the FarmXpress API's transactional /v1/live endpoints (listings and buyer orders).
export const API = import.meta.env.VITE_FARMXPRESS_API_BASE_URL ?? 'http://127.0.0.1:4000/v1';
// The buyer this portal acts for (same identity as the shared buyer panel).
export const BUYER_ID = 'BYR-004';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export async function api<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, body === undefined ? undefined : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new ApiError(0, 'API_UNREACHABLE', `Cannot reach the FarmXpress API at ${API}. Is it running?`);
  }
  let json: unknown = null;
  try { json = await res.json(); } catch { /* handled below */ }
  if (!res.ok) {
    const e = (json as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(res.status, e?.code ?? `HTTP_${res.status}`, e?.message ?? `Request failed (${res.status})`);
  }
  if (json === null) throw new ApiError(res.status, 'BAD_RESPONSE', 'Unreadable API response');
  return json as T;
}
export const errText = (e: unknown) => (e instanceof ApiError ? `${e.message} (${e.code})` : String(e));
export const newKey = () => (crypto?.randomUUID ? crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`);
export const rm = (sen: number | null | undefined) => (sen == null ? 'not recorded' : `RM ${(sen / 100).toFixed(2)}`);

export type Listing = {
  listing_id: string; source_type: 'dataset_batch' | 'delivery_request'; source_id: string; seller_farmer_id: string; seller_name: string | null;
  product_id: string; product_name: string | null; storage_class: 'chilled' | 'cool' | 'ambient' | null; shelf_life_days: number | null;
  hub_id: string; hub_name: string | null; hub_state: string | null; harvest_at: string | null; listed_kg: number; available_kg: number;
  price_sen_per_kg: number; price_basis: string; status: 'active' | 'sold_out' | 'withdrawn'; freshness_score_at_harvest: number | null;
  days_of_shelf_life_left?: number | null; past_shelf_life?: boolean;
  farm: { farm_id: string; name: string; region: string; state: string } | null;
};
export type OrderStatus = 'placed' | 'accepted' | 'rejected' | 'cancelled' | 'ready_for_pickup';
export type LiveOrder = {
  order_id: string; buyer_id: string; seller_farmer_id: string; seller_name: string | null; hub_id: string; hub_name: string | null; status: OrderStatus;
  delivery_preference: string; requested_delivery_by: string | null; subtotal_sen: number; total_kg: number; created_at: string; decision_reason?: string | null;
  lines: { listing_id: string; product_name: string | null; source_type: string; source_id: string; quantity_kg: number; unit_price_sen_per_kg: number; line_total_sen: number }[];
  events: { from_status: string | null; to_status: string; actor_role: string; actor_id: string; at: string }[];
  // Where the order is now (hub decision + dispatch + proof of delivery), from the API.
  progress?: { stage: string; label: string } | null;
  delivery: { status: string; status_label?: string; shipment_id: string | null; driver_id?: string | null; driver_name?: string | null; vehicle_id?: string | null; eta_at?: string | null;
    delivered_kg?: number | null; outstanding_kg?: number | null;
    fulfilment?: { status_label: string; delivered_qty: number; outstanding_qty: number; pods: { pod_id: string; outcome: string; delivered_qty: number; reason_label: string | null; produce_condition: string; notes: string | null; recipient_name: string | null; delivered_at: string; decision: { status: string; resolution: string | null; note: string | null } | null }[] } | null };
};

// The buyer this portal acts for, from the FarmXpress dataset (GET /v1/buyers/{id}). Shown in the header and settings,
// so the portal never shows a different, made-up business name.
export type BuyerProfile = { buyer_id: string; name: string; type: string; state: string; primary_hub_id: string | null };
let profileCache: Promise<BuyerProfile | null> | null = null;
export function loadBuyerProfile(): Promise<BuyerProfile | null> {
  profileCache ??= api<{ buyer: BuyerProfile }>(`/buyers/${BUYER_ID}?limit=1`).then((d) => d.buyer).catch(() => { profileCache = null; return null; });
  return profileCache;
}
export const initials = (name: string | null | undefined) => (name ?? BUYER_ID).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
