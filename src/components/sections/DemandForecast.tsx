import { BrainCircuit, TrendingUp, TrendingDown, Minus, Calendar, Loader2 } from 'lucide-react';
import { SectionHeader } from '@/components/ui';
import { useLiveData } from '@/lib/useLiveData';
import type { AiRecommendation } from '@/lib/types';

const staticSeries = [
  { day: 'Mon', veg: 820, tom: 420, car: 300 },
  { day: 'Tue', veg: 900, tom: 460, car: 310 },
  { day: 'Wed', veg: 1050, tom: 520, car: 330 },
  { day: 'Thu', veg: 1120, tom: 560, car: 340 },
  { day: 'Fri', veg: 1200, tom: 640, car: 380 },
  { day: 'Sat', veg: 1180, tom: 600, car: 370 },
  { day: 'Sun', veg: 980, tom: 500, car: 320 },
];

interface DemandChange {
  product: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  suggested_kg: number;
}

export default function DemandForecast() {
  const { data: recs, loading } = useLiveData<AiRecommendation>('ai_recommendations', '*');
  const forecastRec = recs?.find((r) => r.recommendation_type === 'demand_forecast');
  const demandChanges = ((forecastRec?.payload ?? {}) as any).demand_changes as DemandChange[] | undefined;

  const items = demandChanges ?? [
    { product: 'Vegetables', change: '+18%', trend: 'up' as const, suggested_kg: 1200 },
    { product: 'Tomatoes', change: '+12%', trend: 'up' as const, suggested_kg: 640 },
    { product: 'Carrots', change: 'Stable', trend: 'stable' as const, suggested_kg: 380 },
    { product: 'Strawberries', change: '+9%', trend: 'up' as const, suggested_kg: 210 },
    { product: 'Sweet Corn', change: '-4%', trend: 'down' as const, suggested_kg: 260 },
  ];

  const maxVal = Math.max(...staticSeries.flatMap((d) => [d.veg, d.tom, d.car]));

  return (
    <section>
      <SectionHeader title="AI Demand Forecasting" subtitle="Reduce waste with data-driven purchase predictions" />
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
              {loading ? <Loader2 className="w-5 h-5 text-brand-400 animate-spin" /> : <BrainCircuit className="w-5 h-5 text-brand-600" />}
            </div>
            <h3 className="font-display font-bold text-brand-800">Next Week Forecast</h3>
            <span className="ml-auto chip bg-brand-50 text-brand-600">
              <Calendar className="w-3 h-3" /> Jul 24 – Jul 30
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 h-44 mb-2">
            {staticSeries.map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-1 h-36">
                  <div className="w-2.5 rounded-t-md bg-brand-500 bar-grow" style={{ height: `${(d.veg / maxVal) * 100}%`, animationDelay: `${i * 60}ms` }} title={`Vegetables: ${d.veg}kg`} />
                  <div className="w-2.5 rounded-t-md bg-amber-400 bar-grow" style={{ height: `${(d.tom / maxVal) * 100}%`, animationDelay: `${i * 60 + 30}ms` }} title={`Tomatoes: ${d.tom}kg`} />
                  <div className="w-2.5 rounded-t-md bg-earth-400 bar-grow" style={{ height: `${(d.car / maxVal) * 100}%`, animationDelay: `${i * 60 + 60}ms` }} title={`Carrots: ${d.car}kg`} />
                </div>
                <span className="text-[10px] font-semibold text-brand-500">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 justify-center mt-2">
            <Legend color="bg-brand-500" label="Vegetables" />
            <Legend color="bg-amber-400" label="Tomatoes" />
            <Legend color="bg-earth-400" label="Carrots" />
          </div>
          {forecastRec && (
            <p className="text-[11px] text-brand-400 font-mono mt-3 text-center">AI Confidence: {forecastRec.confidence}% · Rec ID: {forecastRec.id.slice(0, 8)}</p>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-display font-bold text-brand-800 mb-4">Demand Changes</h3>
          <div className="space-y-3">
            {items.map((item, i) => {
              const Icon = item.trend === 'up' ? TrendingUp : item.trend === 'down' ? TrendingDown : Minus;
              const tone = item.trend === 'up' ? 'text-brand-600 bg-brand-50' : item.trend === 'down' ? 'text-red-500 bg-red-50' : 'text-earth-500 bg-earth-100';
              const emoji = ['🥬', '🍅', '🥕', '🍓', '🌽'][i] ?? '📦';
              return (
                <div key={item.product} className="flex items-center gap-3 rounded-xl border border-brand-50 p-3 hover:bg-brand-50/50 transition animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-brand-800">{item.product}</p>
                    <p className="text-[11px] text-brand-500">Suggest {item.suggested_kg} kg</p>
                  </div>
                  <span className={`chip ${tone}`}>
                    <Icon className="w-3.5 h-3.5" /> {item.change}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white">
            <p className="text-xs font-bold mb-1">Seasonal Recommendation</p>
            <p className="text-[11px] text-brand-100 leading-relaxed">Stock up on leafy greens — monsoon season increases demand by 18% next week.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded ${color}`} />
      <span className="text-xs font-semibold text-brand-600">{label}</span>
    </div>
  );
}
