import { useEffect, useRef } from 'react';
import { supabase } from './supabase';
import type { FarmEvent, EventSeverity } from './types';

// Simulates the other 6 FarmXpress modules emitting events into the shared events table.
// The Buyer Portal subscribes to these via realtime and reacts with toasts/badges/dashboard updates.

interface SimEvent {
  event_type: string;
  source_module: FarmEvent['source_module'];
  entity_type: string;
  entity_code: string;
  severity: EventSeverity;
  message: string;
  payload: Record<string, unknown>;
  // side-effect on a table
  update?: { table: string; match: Record<string, string>; set: Record<string, unknown> };
}

const scenarios: SimEvent[] = [
  // IoT Sensor Platform — temperature abnormality
  {
    event_type: 'iot_temperature_alert',
    source_module: 'IoT Sensor Platform',
    entity_type: 'vehicle',
    entity_code: 'VEH-08',
    severity: 'warning',
    message: 'Temperature in VEH-08 rising: 6.2°C detected (threshold 5°C)',
    payload: { vehicle: 'VEH-08', temperature: 6.2, threshold: 5.0 },
    update: { table: 'vehicles', match: { code: 'VEH-08' }, set: { temperature: 6.2 } },
  },
  // Driver Portal — delay report
  {
    event_type: 'delivery_delay',
    source_module: 'Driver Portal',
    entity_type: 'route',
    entity_code: 'RTE-301',
    severity: 'warning',
    message: 'Driver reported heavy traffic on Ipoh Highway — ETA extended 15 min',
    payload: { route: 'RTE-301', delay_minutes: 15, cause: 'traffic' },
    update: { table: 'routes', match: { code: 'RTE-301' }, set: { eta_minutes: 60, traffic: 'Heavy' } },
  },
  // IoT Sensor Platform — temperature back to normal
  {
    event_type: 'iot_temperature_normal',
    source_module: 'IoT Sensor Platform',
    entity_type: 'vehicle',
    entity_code: 'VEH-08',
    severity: 'success',
    message: 'Temperature in VEH-08 stabilized at 4.4°C',
    payload: { vehicle: 'VEH-08', temperature: 4.4 },
    update: { table: 'vehicles', match: { code: 'VEH-08' }, set: { temperature: 4.4 } },
  },
  // Weather alert from Government Dashboard
  {
    event_type: 'weather_alert',
    source_module: 'Government Dashboard',
    entity_type: 'route',
    entity_code: 'RTE-303',
    severity: 'warning',
    message: 'Heavy rain warning issued for KL approach corridor',
    payload: { route: 'RTE-303', weather: 'Heavy Rain' },
    update: { table: 'routes', match: { code: 'RTE-303' }, set: { weather: 'Heavy Rain' } },
  },
  // Hub Control Tower — quality inspection failure
  {
    event_type: 'quality_inspection_failed',
    source_module: 'Consolidation Hub Control Tower',
    entity_type: 'batch',
    entity_code: 'BATCH-2026-006',
    severity: 'critical',
    message: 'Quality inspection FAILED for Sweet Corn (BATCH-2026-006) — pest damage detected',
    payload: { batch: 'BATCH-2026-006', defect: 'pest_damage', grade: 'Rejected' },
    update: { table: 'batches', match: { code: 'BATCH-2026-006' }, set: { status: 'Rejected', grade: 'Rejected' } },
  },
  // AI Logistics Engine — route optimization recommendation
  {
    event_type: 'ai_route_optimization',
    source_module: 'AI Logistics Recommendation Engine',
    entity_type: 'route',
    entity_code: 'RTE-302',
    severity: 'info',
    message: 'AI suggests rerouting RTE-302 via PLUS Highway to save 12 min',
    payload: { route: 'RTE-302', savings_min: 12, alt_route: 'PLUS Highway' },
  },
  // Farmer Portal — new batch harvested
  {
    event_type: 'batch_harvested',
    source_module: 'Farmer Portal',
    entity_type: 'batch',
    entity_code: 'BATCH-2026-007',
    severity: 'success',
    message: 'Johor Green Farm harvested 600kg of premium tomatoes — now available',
    payload: { batch: 'BATCH-2026-007', farmer: 'FARM-001', product: 'Premium Tomatoes', kg: 600 },
  },
  // Driver Portal — successful delivery
  {
    event_type: 'delivery_completed',
    source_module: 'Driver Portal',
    entity_type: 'route',
    entity_code: 'RTE-303',
    severity: 'success',
    message: 'Delivery completed: RTE-303 arrived at FreshMart Central',
    payload: { route: 'RTE-303', status: 'Delivered' },
    update: { table: 'routes', match: { code: 'RTE-303' }, set: { status: 'Delivered', progress: 100, eta_minutes: 0 } },
  },
  // IoT — humidity spike
  {
    event_type: 'iot_humidity_alert',
    source_module: 'IoT Sensor Platform',
    entity_type: 'batch',
    entity_code: 'BATCH-2026-002',
    severity: 'warning',
    message: 'Humidity spike in leafy greens batch (78%) — monitor freshness',
    payload: { batch: 'BATCH-2026-002', humidity: 78 },
  },
  // Hub Control Tower — batch dispatched
  {
    event_type: 'batch_dispatched',
    source_module: 'Consolidation Hub Control Tower',
    entity_type: 'route',
    entity_code: 'RTE-301',
    severity: 'info',
    message: 'Batch BATCH-2026-001 dispatched from Johor Hub on VEH-08',
    payload: { batch: 'BATCH-2026-001', route: 'RTE-301', vehicle: 'VEH-08' },
  },
  // AI — emergency reroute
  {
    event_type: 'ai_emergency_reroute',
    source_module: 'AI Logistics Recommendation Engine',
    entity_type: 'route',
    entity_code: 'RTE-301',
    severity: 'critical',
    message: 'Emergency: accident on Ipoh Highway — immediate reroute via Simpang Pulai',
    payload: { route: 'RTE-301', cause: 'accident', alt_route: 'Simpang Pulai' },
    update: { table: 'routes', match: { code: 'RTE-301' }, set: { current_location: 'Simpang Pulai (Rerouted)', traffic: 'Moderate' } },
  },
  // Government Dashboard — compliance check passed
  {
    event_type: 'compliance_passed',
    source_module: 'Government Dashboard',
    entity_type: 'batch',
    entity_code: 'BATCH-2026-001',
    severity: 'success',
    message: 'Food safety compliance verified for BATCH-2026-001 (pesticide residue: clear)',
    payload: { batch: 'BATCH-2026-001', check: 'pesticide_residue', result: 'passed' },
  },
];

export function useEventSimulator() {
  const indexRef = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const emit = async () => {
      const scenario = scenarios[indexRef.current % scenarios.length];
      indexRef.current++;

      // Insert event
      await supabase.from('events').insert({
        event_type: scenario.event_type,
        source_module: scenario.source_module,
        entity_type: scenario.entity_type,
        entity_id: null,
        entity_code: scenario.entity_code,
        payload: scenario.payload,
        severity: scenario.severity,
        message: scenario.message,
      });

      // Apply side-effect update to shared table
      if (scenario.update) {
        await supabase
          .from(scenario.update.table)
          .update(scenario.update.set)
          .match(scenario.update.match);
      }

      // Schedule next event at random interval (8–16s)
      timer = setTimeout(emit, 8000 + Math.random() * 8000);
    };

    // First event after 6s
    timer = setTimeout(emit, 6000);

    return () => clearTimeout(timer);
  }, []);
}
