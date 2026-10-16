import { SectionHeader } from '@/components/ui';
import { useLiveSingle } from '@/lib/useLiveData';
import { BUYER_CODE } from '@/lib/local';
import { PackageCheck, Leaf, CloudOff, Sprout, Recycle, TreePine, Loader2 } from 'lucide-react';
import type { SustainabilityMetric, Buyer } from '@/lib/types';

export default function Sustainability() {
  const { data: buyer } = useLiveSingle<Buyer>('buyers', '*', { code: BUYER_CODE });
  const { data: metrics, loading } = useLiveSingle<SustainabilityMetric>(
    'sustainability_metrics',
    '*',
    buyer ? { buyer_id: buyer.id } : { period: 'Q3 2026' }
  );

  const items = [
    { label: 'Reusable Boxes', value: metrics?.reusable_boxes?.toString() ?? '230', icon: PackageCheck, detail: metrics?.period ?? 'This quarter' },
    { label: 'Food Waste Reduced', value: `${metrics?.food_waste_reduced ?? 18}%`, icon: Leaf, detail: 'vs industry average' },
    { label: 'Carbon Reduction', value: `${metrics?.carbon_reduction_kg ?? 85}kg CO₂`, icon: CloudOff, detail: 'Equivalent to 4 trees' },
  ];

  return (
    <section>
      <SectionHeader title="Sustainability Report" subtitle="Your positive impact on the planet — synced with Government Dashboard" />
      <div className="card p-6 overflow-hidden relative bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <Sprout className="absolute -top-4 -right-4 w-32 h-32 text-white/5" />
        <TreePine className="absolute -bottom-6 -left-6 w-36 h-36 text-white/5" />

        <div className="flex items-center gap-2.5 mb-5 relative">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            {loading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Recycle className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h3 className="font-display font-bold">Your Sustainable Purchase</h3>
            <p className="text-xs text-brand-100">Tracking your environmental impact · {metrics?.period ?? 'Q3 2026'}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 relative">
          {items.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-2xl bg-white/10 backdrop-blur p-5 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <Icon className="w-[22px] h-[22px] text-white" />
                </div>
                <p className="font-display text-3xl font-extrabold">{s.value}</p>
                <p className="text-sm font-semibold mt-0.5">{s.label}</p>
                <p className="text-[11px] text-brand-100 mt-1">{s.detail}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl bg-white/10 backdrop-blur p-4 flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <p className="text-xs text-brand-50 leading-relaxed">
            By sourcing through FarmXpress, you've contributed to <span className="font-bold">{metrics?.carbon_reduction_kg ?? 85}kg CO₂ reduction</span> — equivalent to planting 4 trees this quarter.
          </p>
        </div>
      </div>
    </section>
  );
}
