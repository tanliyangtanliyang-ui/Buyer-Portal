import { Truck, MapPin, Clock, Thermometer, Leaf, Loader2, AlertTriangle, CloudRain } from 'lucide-react';
import { SectionHeader, FreshnessMeter, ProgressBar, Badge } from '@/components/ui';
import { useLiveData } from '@/lib/useLiveData';
import { useEvents } from '@/lib/eventBus';
import { useState } from 'react';
import type { Route, Vehicle, Driver, Hub, FarmEvent } from '@/lib/types';

export default function DeliveryTracking() {
  const { data: routes, loading } = useLiveData<Route>('routes', '*, vehicles(*), drivers(*), hubs(*)');
  const { events } = useEvents();
  const [active, setActive] = useState(0);

  if (loading || !routes) {
    return (
      <section>
        <SectionHeader title="Smart Delivery Tracking" subtitle="Real-time visibility into your shipments" />
        <div className="flex items-center justify-center py-20 text-brand-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </section>
    );
  }

  const route = routes[active] ?? routes[0];
  const vehicle = (route as any)?.vehicles as Vehicle | null;
  const driver = (route as any)?.drivers as Driver | null;
  const hub = (route as any)?.hubs as Hub | null;

  // Alerts for this route
  const routeEvents = events.filter((e) => e.entity_code === route?.code);
  const hasAlert = routeEvents.some((e) => e.severity === 'warning' || e.severity === 'critical');
  const weatherAlert = route?.weather !== 'Clear' && route?.weather !== 'Cloudy';
  const trafficAlert = route?.traffic === 'Heavy' || route?.traffic === 'Moderate';

  return (
    <section>
      <SectionHeader title="Smart Delivery Tracking" subtitle="Real-time visibility into your shipments — synced with Driver Portal & IoT" />
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Map */}
        <div className="card p-0 overflow-hidden lg:col-span-3 relative">
          <div className="relative h-80 lg:h-full min-h-[320px] bg-gradient-to-br from-brand-50 via-cream to-brand-50">
            <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 440 200">
              <defs>
                <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#bbf7d0" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid2)" />
              <path d="M 20 180 C 80 120, 160 220, 240 140 S 360 80, 420 120" fill="none" stroke="#16a34a" strokeWidth="3" strokeDasharray="8 6" strokeLinecap="round" />
              <circle cx="20" cy="180" r="6" fill="#16a34a" />
              <circle cx="20" cy="180" r="10" fill="#16a34a" opacity="0.2" className="animate-pulse-soft" />
              <circle cx="420" cy="120" r="6" fill="#15803d" />
              <circle cx="420" cy="120" r="12" fill="#15803d" opacity="0.2" />
            </svg>
            <div className="absolute truck-route top-0 left-0">
              <div className={`w-9 h-9 rounded-xl bg-white shadow-pop flex items-center justify-center -rotate-12 ${hasAlert ? 'ring-2 ring-amber-400' : ''}`}>
                <Truck className={`w-5 h-5 ${hasAlert ? 'text-amber-500' : 'text-brand-600'}`} />
              </div>
            </div>
            {/* Alert chips */}
            {hasAlert && (
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                {routeEvents.filter((e) => e.severity === 'warning' || e.severity === 'critical').slice(0, 2).map((e) => (
                  <div key={e.id} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 ${e.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    <AlertTriangle className="w-3 h-3" /> {e.message?.slice(0, 40)}…
                  </div>
                ))}
              </div>
            )}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-xl px-3 py-2 flex items-center gap-2 shadow-soft">
              <span className="text-lg">{weatherAlert ? '🌧️' : '⛅'}</span>
              <div className="leading-tight">
                <p className="text-[11px] font-bold text-brand-800">{weatherAlert ? route.weather : '28°C · Clear'}</p>
                <p className="text-[10px] text-brand-500">{trafficAlert ? route.traffic + ' traffic' : 'Light traffic'}</p>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 shadow-soft">
              <p className="text-[11px] font-bold text-brand-700">{hub?.name ?? route.origin}</p>
            </div>
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 shadow-soft">
              <p className="text-[11px] font-bold text-brand-700">{route.destination}</p>
            </div>
          </div>
        </div>

        {/* Truck list */}
        <div className="lg:col-span-2 space-y-3">
          {routes.map((t, i) => {
            const v = (t as any).vehicles as Vehicle | null;
            const d = (t as any).drivers as Driver | null;
            const tEvents = events.filter((e) => e.entity_code === t.code);
            const tAlert = tEvents.some((e) => e.severity === 'warning' || e.severity === 'critical');
            return (
              <button
                key={t.id}
                onClick={() => setActive(i)}
                className={`w-full text-left card p-4 transition-all duration-300 ${i === active ? 'ring-2 ring-brand-400 shadow-pop' : 'hover:shadow-soft'}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative ${i === active ? 'bg-brand-500' : 'bg-brand-50'}`}>
                    <Truck className={`w-5 h-5 ${i === active ? 'text-white' : 'text-brand-600'}`} />
                    {tAlert && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 ring-2 ring-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-brand-800">{v?.code ?? 'Truck'} · {t.code}</p>
                    <p className="text-[11px] text-brand-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {t.current_location}
                    </p>
                  </div>
                  <Badge tone={t.status === 'Delivered' ? 'green' : t.eta_minutes < 30 ? 'green' : tAlert ? 'amber' : 'blue'}>
                    {t.status === 'Delivered' ? 'Delivered' : `${t.eta_minutes} min`}
                  </Badge>
                </div>
                <ProgressBar value={t.progress} tone={i === active ? 'bg-brand-500' : 'bg-brand-300'} />
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <Stat icon={Clock} label="ETA" value={`${t.eta_minutes}m`} />
                  <Stat icon={Thermometer} label="Temp" value={`${t.temperature}°C`} />
                  <Stat icon={Leaf} label="Fresh" value={`${t.freshness}%`} />
                </div>
                <div className="flex items-center gap-2 mt-2 text-[10px]">
                  <span className="font-mono text-brand-400">{d?.code ?? 'DRV'}</span>
                  <span className="text-brand-500">{d?.name ?? 'Driver'}</span>
                  {t.weather !== 'Clear' && <span className="flex items-center gap-0.5 text-sky-500"><CloudRain className="w-3 h-3" /> {t.weather}</span>}
                </div>
                {i === active && (
                  <div className="mt-3 pt-3 border-t border-brand-50 animate-fade-up">
                    <FreshnessMeter value={t.freshness} label="Live Freshness" />
                    {tEvents.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {tEvents.slice(0, 3).map((e: FarmEvent) => (
                          <div key={e.id} className="text-[10px] flex items-center gap-1.5 text-brand-500">
                            <span className={`w-1.5 h-1.5 rounded-full ${e.severity === 'critical' ? 'bg-red-500' : e.severity === 'warning' ? 'bg-amber-500' : 'bg-brand-400'}`} />
                            {e.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-brand-50/60 py-2">
      <Icon className="w-3.5 h-3.5 text-brand-500 mx-auto" />
      <p className="text-[10px] text-brand-500 mt-0.5">{label}</p>
      <p className="text-xs font-bold text-brand-800">{value}</p>
    </div>
  );
}
