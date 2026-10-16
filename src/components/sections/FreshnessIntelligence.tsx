import { BrainCircuit, Sparkles, Check, TrendingDown, Loader2, Thermometer, Droplets } from 'lucide-react';
import { SectionHeader } from '@/components/ui';
import { useLiveData } from '@/lib/useLiveData';
import type { AiRecommendation, IotReading, Batch } from '@/lib/types';

export default function FreshnessIntelligence() {
  const { data: recs, loading } = useLiveData<AiRecommendation>('ai_recommendations', '*');
  const { data: iot } = useLiveData<IotReading>('iot_readings', '*', (q: any) => q.order('recorded_at', { ascending: false }).limit(3));
  const { data: batches } = useLiveData<Batch>('batches', '*');

  const freshRec = recs?.find((r) => r.recommendation_type === 'freshness_prediction');
  const p = (freshRec?.payload ?? {}) as any;
  const current = p.current_freshness ?? 96;
  const predicted = p.predicted_freshness ?? 91;
  const drop = current - predicted;
  const meter = current >= 90 ? 'Excellent' : current >= 80 ? 'Good' : 'Fair';

  return (
    <section>
      <SectionHeader title="Freshness Intelligence" subtitle="AI-powered freshness prediction for incoming orders" />
      <div className="card p-6 overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-100/50 rounded-full blur-2xl" />

        <div className="flex items-center gap-2.5 mb-5 relative">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-brand-800">AI Freshness Prediction</h3>
            <p className="text-xs text-brand-500">Powered by FarmXpress Intelligence Engine</p>
          </div>
          <span className="ml-auto chip bg-brand-100 text-brand-700">
            <Sparkles className="w-3 h-3" /> Live
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-brand-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6 relative">
            <div className="space-y-4">
              <InfoRow label="Product" value={p.product ?? 'Leafy Vegetables'} />
              <InfoRow label="Current Freshness" value={`${current}%`} highlight />
              <InfoRow label="Expected Arrival" value={p.arrival ?? 'Tomorrow 8 AM'} />
              <InfoRow label="Predicted Freshness" value={`${predicted}%`} highlight />
              <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold">
                <TrendingDown className="w-3.5 h-3.5" /> Expected drop of {drop}% during transit
              </div>
              {freshRec && (
                <p className="text-[11px] text-brand-400 font-mono">Rec ID: {freshRec.id.slice(0, 8)} · Confidence {freshRec.confidence}%</p>
              )}
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-cream p-5 flex flex-col">
              <p className="text-xs font-semibold text-brand-600/60 uppercase tracking-wide mb-2">Freshness Meter</p>
              <div className="flex items-end gap-2 mb-3">
                <span className="font-display text-4xl font-extrabold text-brand-700">{current}%</span>
                <span className="text-sm font-bold text-brand-500 mb-1.5">{meter}</span>
              </div>
              <div className="h-4 w-full rounded-full bg-brand-100 overflow-hidden mb-4">
                <div className="freshness-fill h-full rounded-full transition-all duration-700" style={{ width: `${current}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-brand-400 font-semibold mb-4">
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
              <div className="mt-auto rounded-xl bg-white p-3.5 border border-brand-100 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-700">Recommendation</p>
                  <p className="text-xs text-brand-600 mt-0.5">{p.recommendation ?? 'Order quantity is optimal.'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live IoT readings */}
        {iot && iot.length > 0 && (
          <div className="mt-5 pt-4 border-t border-brand-50 relative">
            <p className="text-xs font-bold text-brand-600 uppercase tracking-wide mb-2">Live IoT Sensor Readings</p>
            <div className="grid grid-cols-3 gap-2">
              {iot.map((r) => {
                const batch = batches?.find((b) => b.id === r.batch_id);
                const abnormal = r.status !== 'Normal';
                return (
                  <div key={r.id} className={`rounded-xl p-2.5 border ${abnormal ? 'bg-amber-50 border-amber-200' : 'bg-brand-50/60 border-brand-100'}`}>
                    <p className="text-[10px] font-mono text-brand-500 truncate">{batch?.code ?? 'Sensor'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Thermometer className={`w-3 h-3 ${abnormal ? 'text-amber-500' : 'text-brand-500'}`} />
                      <span className="text-xs font-bold text-brand-800">{r.temperature}°C</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-sky-400" />
                      <span className="text-[11px] text-brand-600">{r.humidity}%</span>
                    </div>
                    <p className={`text-[10px] font-semibold mt-0.5 ${abnormal ? 'text-amber-600' : 'text-brand-500'}`}>{r.status}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-brand-50 pb-2.5">
      <span className="text-sm text-brand-500 font-semibold">{label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-brand-700' : 'text-brand-800'}`}>{value}</span>
    </div>
  );
}
