import { useState } from 'react';
import { SectionHeader } from '@/components/ui';
import { useLiveData } from '@/lib/useLiveData';
import { useEvents } from '@/lib/eventBus';
import { Loader2, MapPin } from 'lucide-react';
import type { Batch, Route, Order, Farmer, Hub, Vehicle, Driver, FarmEvent } from '@/lib/types';

const stageDefs = [
  { id: 'farm', emoji: '🌱', title: 'Farm Harvest' },
  { id: 'hub', emoji: '🏭', title: 'Consolidation Hub' },
  { id: 'inspection', emoji: '🔍', title: 'Quality Inspection' },
  { id: 'transport', emoji: '🚛', title: 'Transportation' },
  { id: 'delivery', emoji: '🏪', title: 'Buyer Delivery' },
];

export default function Traceability() {
  const [active, setActive] = useState(0);
  const { data: batches } = useLiveData<Batch>('batches', '*, farmers(*)');
  const { data: routes } = useLiveData<Route>('routes', '*, vehicles(*), drivers(*), hubs(*)');
  const { events } = useEvents();

  // Pick the first batch with a route for the demo trace
  const batch = batches?.find((b) => b.status !== 'Rejected') ?? batches?.[0];
  const farmer = (batch as any)?.farmers as Farmer | null;
  const route = routes?.find((r) => r.order_id) ?? routes?.[0];
  const vehicle = (route as any)?.vehicles as Vehicle | null;
  const driver = (route as any)?.drivers as Driver | null;
  const hub = (route as any)?.hubs as Hub | null;

  // Find relevant events for this batch/route
  const batchEvents = events.filter(
    (e) => e.entity_code === batch?.code || e.entity_code === route?.code
  );

  const loading = !batches || !routes;

  const stages = [
    {
      detail: [
        { label: 'Supplier', value: farmer?.name ?? '—' },
        { label: 'Farmer ID', value: farmer?.code ?? '—' },
        { label: 'Harvest Time', value: batch?.harvest_time ?? '—' },
        { label: 'Quality', value: batch?.grade ?? '—' },
        { label: 'Batch ID', value: batch?.code ?? '—' },
      ],
    },
    {
      detail: [
        { label: 'Hub', value: hub?.name ?? '—' },
        { label: 'Hub ID', value: hub?.code ?? '—' },
        { label: 'Temperature', value: hub ? `${hub.temperature}°C` : '—' },
        { label: 'Status', value: hub?.status ?? '—' },
      ],
    },
    {
      detail: [
        { label: 'Defect Rate', value: '1.2%' },
        { label: 'Pesticide Test', value: batchEvents.some((e) => e.event_type === 'compliance_passed') ? 'Passed' : 'Pending' },
        { label: 'Grade', value: batch?.grade ?? '—' },
        { label: 'Status', value: batch?.status ?? '—' },
      ],
    },
    {
      detail: [
        { label: 'Vehicle', value: vehicle?.code ?? '—' },
        { label: 'Driver', value: driver?.name ?? '—' },
        { label: 'Temperature', value: route ? `${route.temperature}°C` : '—' },
        { label: 'ETA', value: route ? `${route.eta_minutes} min` : '—' },
        { label: 'Location', value: route?.current_location ?? '—' },
      ],
    },
    {
      detail: [
        { label: 'Destination', value: route?.destination ?? 'FreshMart Central' },
        { label: 'Route ID', value: route?.code ?? '—' },
        { label: 'Progress', value: route ? `${route.progress}%` : '—' },
        { label: 'Status', value: route?.status ?? '—' },
      ],
    },
  ];

  const stage = stages[active];

  return (
    <section>
      <SectionHeader title="Farm-to-Buyer Traceability" subtitle="Track every stage of your shipment's journey — synced across all modules" />
      <div className="card p-6 lg:p-8">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-brand-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            {/* Batch selector */}
            <div className="flex items-center gap-2 mb-5 text-xs">
              <span className="font-semibold text-brand-600">Tracing:</span>
              <span className="font-mono font-bold text-brand-800 bg-brand-50 px-2 py-1 rounded-md">{batch?.code}</span>
              <span className="text-brand-700">{batch?.product}</span>
              {route && (
                <span className="flex items-center gap-1 text-brand-500 ml-2">
                  <MapPin className="w-3 h-3" /> {route.current_location}
                </span>
              )}
            </div>

            {/* Timeline */}
            <div className="flex flex-col lg:flex-row items-center gap-3 lg:gap-0 mb-6">
              {stageDefs.map((s, i) => {
                const done = i <= active;
                const hasEvent = batchEvents.some((e) =>
                  (s.id === 'farm' && e.event_type === 'batch_harvested') ||
                  (s.id === 'inspection' && (e.event_type === 'quality_inspection_failed' || e.event_type === 'compliance_passed')) ||
                  (s.id === 'transport' && (e.event_type === 'delivery_delay' || e.event_type === 'ai_emergency_reroute' || e.event_type === 'batch_dispatched')) ||
                  (s.id === 'delivery' && e.event_type === 'delivery_completed')
                );
                return (
                  <div key={s.id} className="flex items-center lg:flex-1 w-full lg:w-auto">
                    <button
                      onClick={() => setActive(i)}
                      className={`flex flex-col items-center gap-1.5 transition-all duration-300 shrink-0 ${
                        i === active ? 'scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all duration-300 relative ${
                          done ? 'bg-brand-500 border-brand-500 shadow-soft' : 'bg-white border-brand-200'
                        } ${i === active ? 'ring-4 ring-brand-200' : ''} ${hasEvent ? 'ring-2 ring-amber-300' : ''}`}
                      >
                        {s.emoji}
                        {hasEvent && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 ring-2 ring-white" />}
                      </div>
                      <span className={`text-[11px] font-bold ${i === active ? 'text-brand-700' : 'text-brand-500'}`}>{s.title}</span>
                    </button>
                    {i < stageDefs.length - 1 && (
                      <div className="flex-1 h-0.5 mx-2 rounded-full relative overflow-hidden bg-brand-100">
                        <div className="absolute inset-y-0 left-0 bg-brand-500 transition-all duration-500" style={{ width: i < active ? '100%' : '0%' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Detail panel */}
            <div key={active} className="rounded-2xl bg-gradient-to-br from-brand-50 to-cream p-5 animate-fade-up">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{stageDefs[active].emoji}</span>
                <div>
                  <h3 className="font-display font-bold text-brand-800">{stageDefs[active].title}</h3>
                  <p className="text-xs text-brand-500">Stage {active + 1} of {stageDefs.length} · Live data</p>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {stage.detail.map((d) => (
                  <div key={d.label} className="rounded-xl bg-white p-3 border border-brand-100">
                    <p className="text-[11px] text-brand-500 font-semibold uppercase tracking-wide">{d.label}</p>
                    <p className="text-sm font-bold text-brand-800 mt-1 break-words">{d.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cross-module events for this entity */}
            {batchEvents.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-bold text-brand-600 uppercase tracking-wide mb-2">Cross-Module Events ({batchEvents.length})</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {batchEvents.slice(0, 8).map((e: FarmEvent) => (
                    <div key={e.id} className="flex items-center gap-2 text-xs rounded-lg bg-brand-50/60 px-3 py-2">
                      <span className="font-mono text-brand-400">{new Date(e.created_at).toLocaleTimeString()}</span>
                      <span className="font-semibold text-brand-700">{e.source_module}</span>
                      <span className="text-brand-600 flex-1 truncate">{e.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
