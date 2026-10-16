export interface Farmer {
  id: string;
  code: string;
  name: string;
  region: string;
  reliability: number;
  quality: number;
  on_time: number;
  orders_count: number;
  certification: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Buyer {
  id: string;
  code: string;
  name: string;
  type: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface Hub {
  id: string;
  code: string;
  name: string;
  region: string;
  temperature: number;
  status: string;
  created_at: string;
}

export interface Driver {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  status: string;
  created_at: string;
}

export interface Vehicle {
  id: string;
  code: string;
  plate: string | null;
  type: string;
  temperature: number;
  status: string;
  created_at: string;
}

export interface Batch {
  id: string;
  code: string;
  farmer_id: string | null;
  product: string;
  category: string | null;
  grade: string;
  freshness: number;
  harvest_time: string | null;
  available_kg: number;
  image_url: string | null;
  price_per_kg: number | null;
  certification: string;
  status: string;
  created_at: string;
}

export interface Order {
  id: string;
  code: string;
  buyer_id: string | null;
  farmer_id: string | null;
  batch_id: string | null;
  product: string;
  quantity_kg: number;
  price_per_kg: number | null;
  status: string;
  freshness: number;
  order_date: string;
  created_at: string;
}

export interface Route {
  id: string;
  code: string;
  order_id: string | null;
  vehicle_id: string | null;
  driver_id: string | null;
  hub_id: string | null;
  origin: string;
  destination: string;
  current_location: string;
  progress: number;
  eta_minutes: number;
  temperature: number;
  freshness: number;
  status: string;
  weather: string;
  traffic: string;
  created_at: string;
}

export interface IotReading {
  id: string;
  batch_id: string | null;
  vehicle_id: string | null;
  temperature: number;
  humidity: number;
  reading_source: string;
  status: string;
  recorded_at: string;
}

export type EventSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface FarmEvent {
  id: string;
  event_type: string;
  source_module: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_code: string | null;
  payload: Record<string, unknown>;
  severity: EventSeverity;
  message: string | null;
  read: boolean;
  created_at: string;
}

export interface AiRecommendation {
  id: string;
  recommendation_type: string;
  target_entity: string | null;
  target_code: string | null;
  payload: Record<string, unknown>;
  confidence: number;
  status: string;
  created_at: string;
}

export interface SustainabilityMetric {
  id: string;
  buyer_id: string | null;
  reusable_boxes: number;
  food_waste_reduced: number;
  carbon_reduction_kg: number;
  period: string;
  created_at: string;
}

export type ModuleName =
  | 'Farmer Portal'
  | 'Buyer Portal'
  | 'Consolidation Hub Control Tower'
  | 'Driver Portal'
  | 'Government Dashboard'
  | 'AI Logistics Recommendation Engine'
  | 'IoT Sensor Platform';
