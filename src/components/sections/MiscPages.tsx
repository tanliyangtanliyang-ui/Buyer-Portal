import { useLiveData, useLiveSingle } from '@/lib/useLiveData';
import { FreshnessMeter, Badge, SectionHeader, ProgressBar } from '@/components/ui';
import { Search, Filter, Package, AlertTriangle, Loader2 } from 'lucide-react';
import { BUYER_CODE } from '@/lib/supabase';
import type { Order, Buyer, Batch } from '@/lib/types';

const statusTone: Record<string, 'green' | 'amber' | 'blue' | 'gray'> = {
  Delivered: 'green',
  'In Transit': 'blue',
  Processing: 'amber',
  Scheduled: 'gray',
};

export function OrdersPage() {
  const { data: buyer } = useLiveSingle<Buyer>('buyers', '*', { code: BUYER_CODE });
  const { data: orders, loading } = useLiveData<Order>(
    'orders',
    '*',
    (q: any) => (buyer ? q.eq('buyer_id', buyer.id).order('created_at', { ascending: false }) : q)
  );

  return (
    <div className="space-y-6">
      <SectionHeader title="My Orders" subtitle="Manage and track all your purchase orders — synced in real time" />
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-brand-50">
          <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 flex-1 max-w-xs">
            <Search className="w-4 h-4 text-brand-400" />
            <input placeholder="Search orders…" className="bg-transparent outline-none text-sm w-full text-brand-800 placeholder:text-brand-400" />
          </div>
          <button className="flex items-center gap-1.5 rounded-xl bg-white border border-brand-100 px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-brand-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-brand-500 font-semibold uppercase tracking-wide bg-brand-50/50">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Freshness</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders?.map((o) => (
                  <tr key={o.id} className="border-t border-brand-50 hover:bg-brand-50/40 transition">
                    <td className="px-4 py-3 font-bold text-brand-700 font-mono">{o.code}</td>
                    <td className="px-4 py-3 font-semibold text-brand-800">{o.product}</td>
                    <td className="px-4 py-3 text-brand-600">{o.quantity_kg} kg</td>
                    <td className="px-4 py-3 text-brand-500">{o.order_date}</td>
                    <td className="px-4 py-3 w-32"><FreshnessMeter value={o.freshness} /></td>
                    <td className="px-4 py-3"><Badge tone={statusTone[o.status] ?? 'gray'}>{o.status}</Badge></td>
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
  const { data: buyer, loading } = useLiveSingle<Buyer>('buyers', '*', { code: BUYER_CODE });

  return (
    <div className="space-y-6">
      <SectionHeader title="Account Settings" subtitle="Manage your buyer profile and preferences" />
      <div className="card p-6 max-w-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-brand-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl font-extrabold">
                {buyer?.name?.slice(0, 2).toUpperCase() ?? 'FM'}
              </div>
              <div>
                <h3 className="font-display font-bold text-brand-900">{buyer?.name ?? 'FreshMart Central'}</h3>
                <p className="text-sm text-brand-500">{buyer?.type ?? 'Supermarket'} · <span className="font-mono">{buyer?.code ?? 'BUY-001'}</span></p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { l: 'Business Name', v: buyer?.name ?? 'FreshMart Central' },
                { l: 'Contact Person', v: buyer?.contact_person ?? 'Aisyah Rahman' },
                { l: 'Email', v: buyer?.email ?? 'orders@freshmart.my' },
                { l: 'Phone', v: buyer?.phone ?? '+60 3-2200 1100' },
                { l: 'Delivery Address', v: buyer?.address ?? 'Jalan Ampang, KL' },
                { l: 'Account Type', v: buyer?.type ?? 'Enterprise Buyer' },
              ].map((f) => (
                <div key={f.l}>
                  <label className="text-xs font-semibold text-brand-500 uppercase tracking-wide">{f.l}</label>
                  <input defaultValue={f.v} className="mt-1 w-full rounded-xl bg-brand-50/50 border border-brand-100 px-3 py-2.5 text-sm font-semibold text-brand-800 outline-none focus:border-brand-400 focus:bg-white transition" />
                </div>
              ))}
            </div>
            <button className="mt-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 text-sm font-semibold transition">Save Changes</button>
          </>
        )}
      </div>
    </div>
  );
}
