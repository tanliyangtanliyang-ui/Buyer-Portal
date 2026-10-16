/*
# FarmXpress Shared Data Model — Event-Driven Cross-Module Schema

## Purpose
Creates the centralized cloud database that all FarmXpress modules
(Farmer Portal, Buyer Portal, Consolidation Hub Control Tower, Driver Portal,
Government Dashboard, AI Logistics Recommendation Engine, IoT Sensor Platform)
read from and write to. Models a real-time, event-driven logistics system.

## New Tables
1. `farmers` — Farmer Portal entities (farmer_id, name, region, reliability metrics)
2. `buyers` — Buyer Portal entities (buyer_id, name, type, address)
3. `hubs` — Consolidation hubs (hub_id, name, region, temp)
4. `drivers` — Driver Portal entities (driver_id, name, status)
5. `vehicles` — Delivery vehicles (vehicle_id, plate, type, temp)
6. `batches` — Produce batches (batch_id, farmer_id, product, grade, freshness, harvest time)
7. `orders` — Purchase orders (order_id, buyer_id, farmer_id, batch_id, status, qty, freshness)
8. `routes` — Delivery routes (route_id, order_id, vehicle_id, driver_id, hub_id, progress, status)
9. `iot_readings` — IoT sensor telemetry (batch_id/vehicle_id, temp, humidity, timestamp)
10. `events` — Cross-module event bus (event_type, source_module, entity_type, entity_id, payload, severity)
11. `ai_recommendations` — AI Logistics Engine outputs (recommendation_type, target, payload)
12. `sustainability_metrics` — Buyer sustainability impact (buyer_id, reusable_boxes, waste_reduced, carbon_kg)

## Consistent Identifiers
All IDs are UUIDs with human-readable prefixes stored in a `code` text column
(e.g. FARM-001, BUY-001, BATCH-2026-001, ORD-2041, RTE-301, VEH-08, DRV-014, HUB-JHR).
The UUID `id` is the primary key; `code` is the stable business identifier shared across modules.

## Security
- Single-tenant demo (no sign-in). RLS enabled on every table.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is intentionally shared/public demo data across simulated modules.

## Notes
1. Realtime is enabled on the `events` table so the Buyer Portal can subscribe to
   cross-module events as they are inserted by the simulator.
2. The `events` table is append-only by design (an event log).
3. `severity` on events drives UI alert styling (info, warning, critical, success).
*/

-- ============ FARMERS ============
CREATE TABLE IF NOT EXISTS farmers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  region text NOT NULL,
  reliability numeric DEFAULT 95,
  quality numeric DEFAULT 95,
  on_time numeric DEFAULT 95,
  orders_count int DEFAULT 0,
  certification text DEFAULT 'GAP Certified',
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_farmers" ON farmers;
CREATE POLICY "anon_crud_farmers" ON farmers FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ BUYERS ============
CREATE TABLE IF NOT EXISTS buyers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'Supermarket',
  contact_person text,
  email text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_buyers" ON buyers;
CREATE POLICY "anon_crud_buyers" ON buyers FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ HUBS ============
CREATE TABLE IF NOT EXISTS hubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  region text NOT NULL,
  temperature numeric DEFAULT 4.0,
  status text DEFAULT 'Operational',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_hubs" ON hubs;
CREATE POLICY "anon_crud_hubs" ON hubs FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ DRIVERS ============
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  status text DEFAULT 'Available',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_drivers" ON drivers;
CREATE POLICY "anon_crud_drivers" ON drivers FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ VEHICLES ============
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  plate text,
  type text DEFAULT 'Refrigerated Truck',
  temperature numeric DEFAULT 4.5,
  status text DEFAULT 'Idle',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_vehicles" ON vehicles;
CREATE POLICY "anon_crud_vehicles" ON vehicles FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ BATCHES ============
CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  farmer_id uuid REFERENCES farmers(id) ON DELETE SET NULL,
  product text NOT NULL,
  category text,
  grade text DEFAULT 'Grade A',
  freshness numeric DEFAULT 96,
  harvest_time text,
  available_kg numeric DEFAULT 0,
  image_url text,
  price_per_kg numeric,
  certification text DEFAULT 'GAP Certified',
  status text DEFAULT 'Available',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_batches" ON batches;
CREATE POLICY "anon_crud_batches" ON batches FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ ORDERS ============
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  buyer_id uuid REFERENCES buyers(id) ON DELETE SET NULL,
  farmer_id uuid REFERENCES farmers(id) ON DELETE SET NULL,
  batch_id uuid REFERENCES batches(id) ON DELETE SET NULL,
  product text NOT NULL,
  quantity_kg numeric NOT NULL,
  price_per_kg numeric,
  status text DEFAULT 'Processing',
  freshness numeric DEFAULT 95,
  order_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_orders" ON orders;
CREATE POLICY "anon_crud_orders" ON orders FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ ROUTES ============
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  hub_id uuid REFERENCES hubs(id) ON DELETE SET NULL,
  origin text,
  destination text,
  current_location text,
  progress numeric DEFAULT 0,
  eta_minutes int DEFAULT 60,
  temperature numeric DEFAULT 4.5,
  freshness numeric DEFAULT 95,
  status text DEFAULT 'Scheduled',
  weather text DEFAULT 'Clear',
  traffic text DEFAULT 'Light',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_routes" ON routes;
CREATE POLICY "anon_crud_routes" ON routes FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ IOT READINGS ============
CREATE TABLE IF NOT EXISTS iot_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES batches(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  temperature numeric NOT NULL,
  humidity numeric DEFAULT 65,
  reading_source text DEFAULT 'Vehicle Sensor',
  status text DEFAULT 'Normal',
  recorded_at timestamptz DEFAULT now()
);
ALTER TABLE iot_readings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_iot_readings" ON iot_readings;
CREATE POLICY "anon_crud_iot_readings" ON iot_readings FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ EVENTS (Cross-Module Event Bus) ============
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  source_module text NOT NULL,
  entity_type text,
  entity_id text,
  entity_code text,
  payload jsonb DEFAULT '{}'::jsonb,
  severity text DEFAULT 'info',
  message text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_events" ON events;
CREATE POLICY "anon_crud_events" ON events FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_read ON events (read);

-- ============ AI RECOMMENDATIONS ============
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_type text NOT NULL,
  target_entity text,
  target_code text,
  payload jsonb DEFAULT '{}'::jsonb,
  confidence numeric DEFAULT 90,
  status text DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_ai_recommendations" ON ai_recommendations;
CREATE POLICY "anon_crud_ai_recommendations" ON ai_recommendations FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ SUSTAINABILITY METRICS ============
CREATE TABLE IF NOT EXISTS sustainability_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES buyers(id) ON DELETE SET NULL,
  reusable_boxes int DEFAULT 0,
  food_waste_reduced numeric DEFAULT 0,
  carbon_reduction_kg numeric DEFAULT 0,
  period text DEFAULT 'Q3 2026',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sustainability_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_sustainability" ON sustainability_metrics;
CREATE POLICY "anon_crud_sustainability" ON sustainability_metrics FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ SEED DATA ============

-- Buyers
INSERT INTO buyers (code, name, type, contact_person, email, phone, address)
VALUES ('BUY-001', 'FreshMart Central', 'Supermarket', 'Aisyah Rahman', 'orders@freshmart.my', '+60 3-2200 1100', 'Jalan Ampang, Kuala Lumpur')
ON CONFLICT (code) DO NOTHING;

-- Farmers
INSERT INTO farmers (code, name, region, reliability, quality, on_time, orders_count, certification, avatar_url) VALUES
('FARM-001', 'Johor Green Farm', 'Johor', 98, 95, 97, 42, 'GAP Certified', 'https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg?auto=compress&w=120'),
('FARM-002', 'Cameron Highland Growers', 'Pahang', 96, 97, 94, 31, 'Organic Certified', 'https://images.pexels.com/photos/1112080/pexels-photo-1112080.jpeg?auto=compress&w=120'),
('FARM-003', 'Perak Golden Fields', 'Perak', 93, 91, 90, 18, 'Local Sourced', 'https://images.pexels.com/photos/1591939/pexels-photo-1591939.jpeg?auto=compress&w=120')
ON CONFLICT (code) DO NOTHING;

-- Hubs
INSERT INTO hubs (code, name, region, temperature, status) VALUES
('HUB-JHR', 'Johor Consolidation Hub', 'Johor', 4.0, 'Operational'),
('HUB-CMY', 'Cameron Hub', 'Pahang', 3.5, 'Operational'),
('HUB-KL', 'Kuala Lumpur Distribution Hub', 'Kuala Lumpur', 4.0, 'Operational')
ON CONFLICT (code) DO NOTHING;

-- Drivers
INSERT INTO drivers (code, name, phone, status) VALUES
('DRV-014', 'Tan Wei Long', '+60 12-345 6789', 'On Route'),
('DRV-022', 'Lim Chee Keong', '+60 12-987 6543', 'Available'),
('DRV-031', 'Raj Kumar', '+60 13-222 1111', 'On Route')
ON CONFLICT (code) DO NOTHING;

-- Vehicles
INSERT INTO vehicles (code, plate, type, temperature, status) VALUES
('VEH-08', 'BKG 8080', 'Refrigerated Truck', 4.5, 'In Transit'),
('VEH-03', 'BKG 3030', 'Refrigerated Truck', 4.0, 'In Transit'),
('VEH-12', 'BKG 1212', 'Refrigerated Van', 5.0, 'In Transit')
ON CONFLICT (code) DO NOTHING;

-- Batches
INSERT INTO batches (code, farmer_id, product, category, grade, freshness, harvest_time, available_kg, image_url, price_per_kg, certification, status) VALUES
('BATCH-2026-001', (SELECT id FROM farmers WHERE code='FARM-001'), 'Premium Tomatoes', 'Vegetables', 'Grade A', 98, '06:30 AM', 500, 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&w=600', 4.20, 'GAP Certified', 'Available'),
('BATCH-2026-002', (SELECT id FROM farmers WHERE code='FARM-002'), 'Organic Leafy Greens', 'Vegetables', 'Grade A', 96, '05:00 AM', 320, 'https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?auto=compress&w=600', 6.80, 'Organic Certified', 'Available'),
('BATCH-2026-003', (SELECT id FROM farmers WHERE code='FARM-003'), 'Sweet Carrots', 'Roots', 'Grade A', 94, '07:00 AM', 780, 'https://images.pexels.com/photos/1431333/pexels-photo-1431333.jpeg?auto=compress&w=600', 3.50, 'GAP Certified', 'Available'),
('BATCH-2026-004', (SELECT id FROM farmers WHERE code='FARM-002'), 'Fresh Strawberries', 'Fruits', 'Premium', 97, '04:30 AM', 120, 'https://images.pexels.com/photos/46174/strawberries-berries-srcot-fruit-46174.jpeg?auto=compress&w=600', 12.50, 'Organic Certified', 'Available'),
('BATCH-2026-005', (SELECT id FROM farmers WHERE code='FARM-001'), 'Crunchy Bell Peppers', 'Vegetables', 'Grade A', 93, '06:00 AM', 450, 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&w=600', 5.60, 'GAP Certified', 'Available'),
('BATCH-2026-006', (SELECT id FROM farmers WHERE code='FARM-003'), 'Sweet Corn', 'Grains', 'Grade B+', 92, '05:30 AM', 900, 'https://images.pexels.com/photos/6143328/pexels-photo-6143328.jpeg?auto=compress&w=600', 2.80, 'Local Sourced', 'Available')
ON CONFLICT (code) DO NOTHING;

-- Orders
INSERT INTO orders (code, buyer_id, farmer_id, batch_id, product, quantity_kg, price_per_kg, status, freshness, order_date) VALUES
('ORD-2041', (SELECT id FROM buyers WHERE code='BUY-001'), (SELECT id FROM farmers WHERE code='FARM-001'), (SELECT id FROM batches WHERE code='BATCH-2026-001'), 'Premium Tomatoes', 500, 4.20, 'In Transit', 93, '2026-07-23'),
('ORD-2040', (SELECT id FROM buyers WHERE code='BUY-001'), (SELECT id FROM farmers WHERE code='FARM-002'), (SELECT id FROM batches WHERE code='BATCH-2026-002'), 'Organic Leafy Greens', 320, 6.80, 'Processing', 96, '2026-07-23'),
('ORD-2039', (SELECT id FROM buyers WHERE code='BUY-001'), (SELECT id FROM farmers WHERE code='FARM-003'), (SELECT id FROM batches WHERE code='BATCH-2026-003'), 'Sweet Carrots', 780, 3.50, 'Scheduled', 94, '2026-07-24'),
('ORD-2038', (SELECT id FROM buyers WHERE code='BUY-001'), (SELECT id FROM farmers WHERE code='FARM-002'), (SELECT id FROM batches WHERE code='BATCH-2026-004'), 'Fresh Strawberries', 120, 12.50, 'Delivered', 95, '2026-07-22'),
('ORD-2037', (SELECT id FROM buyers WHERE code='BUY-001'), (SELECT id FROM farmers WHERE code='FARM-001'), (SELECT id FROM batches WHERE code='BATCH-2026-005'), 'Crunchy Bell Peppers', 450, 5.60, 'Delivered', 92, '2026-07-21')
ON CONFLICT (code) DO NOTHING;

-- Routes
INSERT INTO routes (code, order_id, vehicle_id, driver_id, hub_id, origin, destination, current_location, progress, eta_minutes, temperature, freshness, status, weather, traffic) VALUES
('RTE-301', (SELECT id FROM orders WHERE code='ORD-2041'), (SELECT id FROM vehicles WHERE code='VEH-08'), (SELECT id FROM drivers WHERE code='DRV-014'), (SELECT id FROM hubs WHERE code='HUB-JHR'), 'Johor Hub', 'FreshMart Central, KL', 'Ipoh Highway', 68, 45, 4.5, 93, 'In Transit', 'Clear', 'Light'),
('RTE-302', (SELECT id FROM orders WHERE code='ORD-2040'), (SELECT id FROM vehicles WHERE code='VEH-03'), (SELECT id FROM drivers WHERE code='DRV-022'), (SELECT id FROM hubs WHERE code='HUB-CMY'), 'Cameron Hub', 'FreshMart Central, KL', 'Tanjung Malim', 34, 80, 4.0, 95, 'In Transit', 'Cloudy', 'Moderate'),
('RTE-303', (SELECT id FROM orders WHERE code='ORD-2039'), (SELECT id FROM vehicles WHERE code='VEH-12'), (SELECT id FROM drivers WHERE code='DRV-031'), (SELECT id FROM hubs WHERE code='HUB-KL'), 'KL Distribution Hub', 'FreshMart Central, KL', 'Approaching KL', 88, 15, 5.0, 90, 'In Transit', 'Rain', 'Heavy')
ON CONFLICT (code) DO NOTHING;

-- IoT readings
INSERT INTO iot_readings (batch_id, vehicle_id, temperature, humidity, reading_source, status) VALUES
((SELECT id FROM batches WHERE code='BATCH-2026-001'), (SELECT id FROM vehicles WHERE code='VEH-08'), 4.5, 68, 'Vehicle Sensor', 'Normal'),
((SELECT id FROM batches WHERE code='BATCH-2026-002'), (SELECT id FROM vehicles WHERE code='VEH-03'), 4.0, 70, 'Vehicle Sensor', 'Normal'),
((SELECT id FROM batches WHERE code='BATCH-2026-005'), (SELECT id FROM vehicles WHERE code='VEH-12'), 5.0, 65, 'Vehicle Sensor', 'Normal')
ON CONFLICT DO NOTHING;

-- AI recommendations
INSERT INTO ai_recommendations (recommendation_type, target_entity, target_code, payload, confidence, status) VALUES
('demand_forecast', 'buyer', 'BUY-001', '{"product":"Leafy Vegetables","current_freshness":96,"predicted_freshness":91,"arrival":"Tomorrow 8 AM","recommendation":"Order quantity is optimal.","demand_changes":[{"product":"Vegetables","change":"+18%","trend":"up","suggested_kg":1200},{"product":"Tomatoes","change":"+12%","trend":"up","suggested_kg":640},{"product":"Carrots","change":"Stable","trend":"stable","suggested_kg":380},{"product":"Strawberries","change":"+9%","trend":"up","suggested_kg":210},{"product":"Sweet Corn","change":"-4%","trend":"down","suggested_kg":260}]}'::jsonb, 92, 'Active'),
('freshness_prediction', 'batch', 'BATCH-2026-002', '{"product":"Leafy Vegetables","current_freshness":96,"predicted_freshness":91,"arrival":"Tomorrow 8 AM","recommendation":"Order quantity is optimal."}'::jsonb, 88, 'Active')
ON CONFLICT DO NOTHING;

-- Sustainability metrics
INSERT INTO sustainability_metrics (buyer_id, reusable_boxes, food_waste_reduced, carbon_reduction_kg, period) VALUES
((SELECT id FROM buyers WHERE code='BUY-001'), 230, 18, 85, 'Q3 2026')
ON CONFLICT DO NOTHING;

-- Enable realtime on events table
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE routes;
ALTER PUBLICATION supabase_realtime ADD TABLE iot_readings;
