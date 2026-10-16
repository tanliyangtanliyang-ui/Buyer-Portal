import { MapPin, Clock, Package, Award, BadgeCheck, Truck, Plus, Loader2, Check } from 'lucide-react';
import { FreshnessMeter, SectionHeader, Badge } from '@/components/ui';
import { useLiveData } from '@/lib/useLiveData';
import { useEvents } from '@/lib/eventBus';
import { BUYER_CODE } from '@/lib/local';
import { useState } from 'react';
import type { Batch, Farmer } from '@/lib/types';

export default function ProduceMarketplace() {
  const { data: batches, loading } = useLiveData<Batch>('batches', '*, farmers(*)');
  const { publish } = useEvents();
  const [orderingId, setOrderingId] = useState<string | null>(null);
  const [orderedCodes, setOrderedCodes] = useState<Set<string>>(new Set());

  const handleOrder = async (batch: Batch) => {
    const farmer = (batch as any).farmers as Farmer | null;
    setOrderingId(batch.id);
    try {
      const orderCode = `ORD-${Math.floor(2000 + Math.random() * 800)}`;

      // Publish cross-module event — Buyer Portal → system
      await publish({
        event_type: 'order_placed',
        source_module: 'Buyer Portal',
        entity_type: 'order',
        entity_id: null,
        entity_code: orderCode,
        payload: { order_code: orderCode, batch_code: batch.code, product: batch.product, buyer: BUYER_CODE, farmer: farmer?.code },
        severity: 'success',
        message: `New order ${orderCode} placed for ${batch.product} (${batch.code})`,
      });

      setOrderedCodes((prev) => new Set(prev).add(batch.code));
    } finally {
      setOrderingId(null);
    }
  };

  return (
    <section>
      <SectionHeader
        title="Fresh Produce Marketplace"
        subtitle="Verified produce from FarmXpress consolidation hubs"
        action={
          <div className="flex gap-2">
            {['All', 'Vegetables', 'Fruits', 'Roots', 'Grains'].map((f, i) => (
              <button
                key={f}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  i === 0 ? 'bg-brand-600 text-white' : 'bg-white border border-brand-100 text-brand-600 hover:bg-brand-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />
      {loading && (
        <div className="flex items-center justify-center py-20 text-brand-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {batches?.filter((b) => b.status === 'Available').map((p, i) => {
          const farmer = (p as any).farmers as Farmer | null;
          const isOrdering = orderingId === p.id;
          const isOrdered = orderedCodes.has(p.code);
          return (
            <div
              key={p.id}
              className="card overflow-hidden hover:shadow-pop transition-all duration-300 hover:-translate-y-1 animate-fade-up group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={p.image_url ?? ''}
                  alt={p.product}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/40 to-transparent" />
                <div className="absolute top-3 left-3">
                  <Badge tone={p.status === 'Rejected' ? 'red' : 'green'}>
                    <BadgeCheck className="w-3 h-3" /> {p.certification}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-bold text-brand-800">{p.grade}</span>
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  {farmer?.avatar_url && (
                    <img src={farmer.avatar_url} alt={farmer.name} className="w-7 h-7 rounded-full object-cover ring-2 ring-white" />
                  )}
                  <span className="text-xs font-semibold text-white drop-shadow">{farmer?.name ?? 'Verified Farmer'}</span>
                </div>
                <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur rounded-md px-1.5 py-0.5">
                  <span className="text-[10px] font-mono font-bold text-brand-700">{p.code}</span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-bold text-brand-900">{p.product}</h3>
                    <p className="text-xs text-brand-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {farmer?.region ?? p.category}
                    </p>
                  </div>
                  <p className="font-display font-extrabold text-brand-700">${p.price_per_kg?.toFixed(2)}<span className="text-[10px] text-brand-400 font-medium">/kg</span></p>
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <Row icon={Clock} label="Harvest" value={p.harvest_time ?? 'Today'} />
                  <Row icon={Package} label="Available" value={`${p.available_kg} kg`} />
                  <Row icon={Truck} label="Est. Arrival" value="Tomorrow 10:00 AM" />
                </div>

                <div className="mt-3">
                  <FreshnessMeter value={p.freshness} label="Freshness Score" />
                </div>

                <button
                  onClick={() => handleOrder(p)}
                  disabled={isOrdering || isOrdered}
                  className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition ${
                    isOrdered
                      ? 'bg-brand-100 text-brand-600'
                      : 'bg-brand-600 hover:bg-brand-700 text-white'
                  } disabled:cursor-not-allowed`}
                >
                  {isOrdering ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order…</>
                  ) : isOrdered ? (
                    <><Check className="w-4 h-4" /> Order Placed</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Place Order</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-brand-500 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </span>
      <span className="font-semibold text-brand-800">{value}</span>
    </div>
  );
}
