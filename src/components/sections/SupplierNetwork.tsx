import { SectionHeader, ProgressBar } from '@/components/ui';
import { Loader2, MapPin, Info } from 'lucide-react';
import { useBuyerInsights, kg, pctText, dateText } from '@/lib/insights';

export default function SupplierNetwork({ compact = false }: { compact?: boolean }) {
  const { data, error, loading } = useBuyerInsights();
  const list = data ? (compact ? data.suppliers.slice(0, 3) : data.suppliers) : [];

  return (
    <section>
      <SectionHeader title="Supplier Network" subtitle="Farmers whose produce reached your business, from FarmXpress records" />
      {loading && <div className="flex items-center justify-center py-20 text-brand-400"><Loader2 className="w-6 h-6 animate-spin" /></div>}
      {error && <div className="card p-4 text-sm text-red-700 bg-red-50" role="alert">Could not load suppliers: {error}</div>}
      {data && (list.length === 0 ? <div className="card p-6 text-sm text-brand-500 text-center">No suppliers recorded for {data.buyer.name} yet.</div> : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5" data-testid="supplier-list">
          {list.map((s) => (
            <div key={s.farmer_id} className="card p-5" data-testid={`supplier-${s.farmer_id}`}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0">{s.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('')}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-brand-900">{s.name}</h3>
                  <p className="text-xs text-brand-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.place ?? '-'} · <span className="font-mono">{s.farmer_id}</span></p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="rounded-xl bg-brand-50 p-2"><p className="text-brand-500">Orders supplied</p><p className="font-bold text-brand-800">{s.orders}{s.live_orders ? ` + ${s.live_orders} now` : ''}</p></div>
                <div className="rounded-xl bg-brand-50 p-2"><p className="text-brand-500">Delivered to you</p><p className="font-bold text-brand-800">{kg(s.delivered_kg)}{s.live_kg ? ` + ${kg(s.live_kg)} ordered now` : ''}</p></div>
              </div>
              <div className="space-y-3">
                <Metric label="Fill rate (delivered / allocated)" value={s.fill_rate_pct} tone="bg-brand-500" />
                <Metric label="Hub QC pass rate" value={s.qc_pass_rate_pct} tone="bg-lime-500" />
                <Metric label="Avg freshness at hub QC" value={s.avg_qc_freshness} tone="bg-sky-500" suffix="/100" />
              </div>
              <p className="mt-4 pt-3 border-t border-brand-50 text-xs text-brand-600">{s.products.join(', ') || 'Ordered in the portal'}{s.last_order_at ? ` · last order ${dateText(s.last_order_at)}` : ''}</p>
            </div>
          ))}
        </div>
      ))}
      {data && <p className="text-[11px] text-brand-500 mt-3 flex gap-1.5"><Info className="w-3.5 h-3.5 shrink-0" /> {data.supplier_basis}</p>}
    </section>
  );
}

function Metric({ label, value, tone, suffix = '%' }: { label: string; value: number | null; tone: string; suffix?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-brand-600">{label}</span>
        <span className="text-xs font-bold text-brand-800">{value == null ? '-' : suffix === '%' ? pctText(value) : `${value}${suffix}`}</span>
      </div>
      <ProgressBar value={value ?? 0} tone={tone} />
    </div>
  );
}
