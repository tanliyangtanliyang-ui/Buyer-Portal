import { useLiveData } from '@/lib/useLiveData';
import { SectionHeader, ProgressBar } from '@/components/ui';
import { Star, Award, TrendingUp, Loader2 } from 'lucide-react';
import type { Farmer } from '@/lib/types';

export default function SupplierNetwork() {
  const { data: farmers, loading } = useLiveData<Farmer>('farmers', '*');

  return (
    <section>
      <SectionHeader title="Supplier Relationship Management" subtitle="Performance metrics for your verified farm network — synced with Farmer Portal" />
      {loading ? (
        <div className="flex items-center justify-center py-20 text-brand-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {farmers?.map((s, i) => (
            <div key={s.id} className="card p-5 hover:shadow-pop transition-all duration-300 hover:-translate-y-0.5 animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="flex items-center gap-3 mb-4">
                <img src={s.avatar_url ?? ''} alt={s.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-brand-100" />
                <div className="flex-1">
                  <h3 className="font-display font-bold text-brand-900">{s.name}</h3>
                  <p className="text-xs text-brand-500">{s.region} · {s.orders_count} orders · <span className="font-mono">{s.code}</span></p>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 rounded-lg px-2 py-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span className="text-xs font-bold text-amber-600">{(s.reliability / 20).toFixed(1)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Metric label="Reliability" value={s.reliability} tone="bg-brand-500" />
                <Metric label="Average Quality" value={s.quality} tone="bg-lime-500" />
                <Metric label="On-time Delivery" value={s.on_time} tone="bg-sky-500" />
              </div>

              <div className="mt-4 flex items-center gap-2 pt-3 border-t border-brand-50">
                <Award className="w-4 h-4 text-brand-600" />
                <span className="text-xs font-semibold text-brand-700">{s.certification}</span>
                <span className="ml-auto chip bg-brand-50 text-brand-600">
                  <TrendingUp className="w-3 h-3" /> Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-brand-600">{label}</span>
        <span className="text-xs font-bold text-brand-800">{value}%</span>
      </div>
      <ProgressBar value={value} tone={tone} />
    </div>
  );
}
