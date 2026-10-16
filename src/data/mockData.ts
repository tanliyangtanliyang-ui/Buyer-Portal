export type Trend = 'up' | 'down' | 'stable';

export interface SummaryCard {
  id: string;
  label: string;
  value: string;
  sub: string;
  icon: string;
  trend: Trend;
  trendValue: string;
  badge: string;
  badgeTone: 'green' | 'amber' | 'blue';
  spark: number[];
}

export const summaryCards: SummaryCard[] = [
  {
    id: 'orders',
    label: 'Active Orders',
    value: '12',
    sub: '3 awaiting confirmation',
    icon: 'ClipboardList',
    trend: 'up',
    trendValue: '+2 this week',
    badge: 'On track',
    badgeTone: 'green',
    spark: [4, 6, 5, 7, 6, 8, 10, 12],
  },
  {
    id: 'deliveries',
    label: 'Incoming Deliveries',
    value: '5 trucks',
    sub: '2 arriving today',
    icon: 'Truck',
    trend: 'up',
    trendValue: '+1 vs yesterday',
    badge: 'In transit',
    badgeTone: 'blue',
    spark: [2, 3, 3, 4, 3, 5, 4, 5],
  },
  {
    id: 'freshness',
    label: 'Average Freshness Score',
    value: '95%',
    sub: 'Across all shipments',
    icon: 'Leaf',
    trend: 'up',
    trendValue: '+3% vs last month',
    badge: 'Excellent',
    badgeTone: 'green',
    spark: [88, 90, 89, 92, 91, 93, 94, 95],
  },
  {
    id: 'volume',
    label: 'Monthly Purchase Volume',
    value: '8,450 kg',
    sub: 'Of fresh produce',
    icon: 'Package',
    trend: 'up',
    trendValue: '+640 kg vs last month',
    badge: 'Growing',
    badgeTone: 'amber',
    spark: [5200, 6100, 5800, 6900, 7300, 7600, 8100, 8450],
  },
];

export interface Produce {
  id: string;
  name: string;
  origin: string;
  farmer: string;
  farmerAvatar: string;
  image: string;
  freshness: number;
  harvest: string;
  availableKg: number;
  arrival: string;
  grade: string;
  certification: string;
  pricePerKg: number;
  category: string;
}

export const produce: Produce[] = [
  {
    id: 'p1',
    name: 'Premium Tomatoes',
    origin: 'Johor Farm Cluster',
    farmer: 'Johor Green Farm',
    farmerAvatar: 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&w=120',
    image: 'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&w=600',
    freshness: 98,
    harvest: 'Today 06:30 AM',
    availableKg: 500,
    arrival: 'Tomorrow 10:00 AM',
    grade: 'Grade A',
    certification: 'GAP Certified',
    pricePerKg: 4.2,
    category: 'Vegetables',
  },
  {
    id: 'p2',
    name: 'Organic Leafy Greens',
    origin: 'Cameron Highlands',
    farmer: 'Highland Growers Co.',
    farmerAvatar: 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&w=120',
    image: 'https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?auto=compress&w=600',
    freshness: 96,
    harvest: 'Today 05:00 AM',
    availableKg: 320,
    arrival: 'Tomorrow 08:00 AM',
    grade: 'Grade A',
    certification: 'Organic Certified',
    pricePerKg: 6.8,
    category: 'Vegetables',
  },
  {
    id: 'p3',
    name: 'Sweet Carrots',
    origin: 'Kundasang Valley',
    farmer: 'Kinabalu Roots',
    farmerAvatar: 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&w=120',
    image: 'https://images.pexels.com/photos/1431333/pexels-photo-1431333.jpeg?auto=compress&w=600',
    freshness: 94,
    harvest: 'Today 07:00 AM',
    availableKg: 780,
    arrival: 'Tomorrow 11:00 AM',
    grade: 'Grade A',
    certification: 'GAP Certified',
    pricePerKg: 3.5,
    category: 'Roots',
  },
  {
    id: 'p4',
    name: 'Fresh Strawberries',
    origin: 'Cameron Highlands',
    farmer: 'Berry Hill Estate',
    farmerAvatar: 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&w=120',
    image: 'https://images.pexels.com/photos/46174/strawberries-berries-srcot-fruit-46174.jpeg?auto=compress&w=600',
    freshness: 97,
    harvest: 'Today 04:30 AM',
    availableKg: 120,
    arrival: 'Tomorrow 09:00 AM',
    grade: 'Premium',
    certification: 'Organic Certified',
    pricePerKg: 12.5,
    category: 'Fruits',
  },
  {
    id: 'p5',
    name: 'Crunchy Bell Peppers',
    origin: 'Pahang Farm Cluster',
    farmer: 'Pahang Pure Harvest',
    farmerAvatar: 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&w=120',
    image: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&w=600',
    freshness: 93,
    harvest: 'Today 06:00 AM',
    availableKg: 450,
    arrival: 'Tomorrow 10:30 AM',
    grade: 'Grade A',
    certification: 'GAP Certified',
    pricePerKg: 5.6,
    category: 'Vegetables',
  },
  {
    id: 'p6',
    name: 'Sweet Corn',
    origin: 'Perak Plains',
    farmer: 'Perak Golden Fields',
    farmerAvatar: 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&w=120',
    image: 'https://images.pexels.com/photos/6143328/pexels-photo-6143328.jpeg?auto=compress&w=600',
    freshness: 92,
    harvest: 'Today 05:30 AM',
    availableKg: 900,
    arrival: 'Tomorrow 12:00 PM',
    grade: 'Grade B+',
    certification: 'Local Sourced',
    pricePerKg: 2.8,
    category: 'Grains',
  },
];

export interface TraceStage {
  id: string;
  emoji: string;
  title: string;
  detail: { label: string; value: string }[];
}

export const traceStages: TraceStage[] = [
  {
    id: 'farm',
    emoji: '🌱',
    title: 'Farm Harvest',
    detail: [
      { label: 'Supplier', value: 'Johor Green Farm' },
      { label: 'Harvest Time', value: '06:30 AM' },
      { label: 'Farming Method', value: 'Sustainable Farming' },
      { label: 'Quality', value: 'Grade A' },
    ],
  },
  {
    id: 'hub',
    emoji: '🏭',
    title: 'Consolidation Hub',
    detail: [
      { label: 'Temperature', value: '4°C' },
      { label: 'Storage Duration', value: '2 hours' },
      { label: 'Freshness', value: '96%' },
      { label: 'Handling', value: 'Cold-chain certified' },
    ],
  },
  {
    id: 'inspection',
    emoji: '🔍',
    title: 'Quality Inspection',
    detail: [
      { label: 'Inspector', value: 'FarmXpress Lab' },
      { label: 'Defect Rate', value: '1.2%' },
      { label: 'Pesticide Test', value: 'Passed' },
      { label: 'Grade', value: 'A' },
    ],
  },
  {
    id: 'transport',
    emoji: '🚛',
    title: 'Transportation',
    detail: [
      { label: 'Truck', value: '#08' },
      { label: 'Temperature', value: '4.5°C' },
      { label: 'ETA', value: '45 minutes' },
      { label: 'Freshness', value: '93%' },
    ],
  },
  {
    id: 'delivery',
    emoji: '🏪',
    title: 'Buyer Delivery',
    detail: [
      { label: 'Buyer', value: 'FreshMart Central' },
      { label: 'Arrival', value: 'Tomorrow 10:00 AM' },
      { label: 'Quantity', value: '500 kg' },
      { label: 'Status', value: 'Scheduled' },
    ],
  },
];

export interface FreshnessPrediction {
  product: string;
  current: number;
  arrival: string;
  predicted: number;
  recommendation: string;
  meter: 'Excellent' | 'Good' | 'Fair';
}

export const freshnessPrediction: FreshnessPrediction = {
  product: 'Leafy Vegetables',
  current: 96,
  arrival: 'Tomorrow 8 AM',
  predicted: 91,
  recommendation: 'Order quantity is optimal.',
  meter: 'Excellent',
};

export interface DemandItem {
  emoji: string;
  name: string;
  change: string;
  trend: Trend;
  suggestedKg: number;
}

export const demandItems: DemandItem[] = [
  { emoji: '🥬', name: 'Vegetables', change: '+18%', trend: 'up', suggestedKg: 1200 },
  { emoji: '🍅', name: 'Tomatoes', change: '+12%', trend: 'up', suggestedKg: 640 },
  { emoji: '🥕', name: 'Carrots', change: 'Stable', trend: 'stable', suggestedKg: 380 },
  { emoji: '🍓', name: 'Strawberries', change: '+9%', trend: 'up', suggestedKg: 210 },
  { emoji: '🌽', name: 'Sweet Corn', change: '-4%', trend: 'down', suggestedKg: 260 },
];

export const demandForecastSeries = [
  { day: 'Mon', veg: 820, tom: 420, car: 300 },
  { day: 'Tue', veg: 900, tom: 460, car: 310 },
  { day: 'Wed', veg: 1050, tom: 520, car: 330 },
  { day: 'Thu', veg: 1120, tom: 560, car: 340 },
  { day: 'Fri', veg: 1200, tom: 640, car: 380 },
  { day: 'Sat', veg: 1180, tom: 600, car: 370 },
  { day: 'Sun', veg: 980, tom: 500, car: 320 },
];

export interface DeliveryTruck {
  id: string;
  name: string;
  location: string;
  arrival: string;
  temperature: string;
  freshness: number;
  cargo: string;
  progress: number;
}

export const deliveryTrucks: DeliveryTruck[] = [
  {
    id: 't1',
    name: 'Delivery Truck #08',
    location: 'Ipoh Highway',
    arrival: '45 minutes',
    temperature: '4.5°C',
    freshness: 93,
    cargo: 'Tomatoes · 500 kg',
    progress: 68,
  },
  {
    id: 't2',
    name: 'Delivery Truck #03',
    location: 'Tanjung Malim',
    arrival: '1 hr 20 min',
    temperature: '4.0°C',
    freshness: 95,
    cargo: 'Leafy Greens · 320 kg',
    progress: 34,
  },
  {
    id: 't3',
    name: 'Delivery Truck #12',
    location: 'Approaching KL',
    arrival: '15 minutes',
    temperature: '5.0°C',
    freshness: 90,
    cargo: 'Bell Peppers · 450 kg',
    progress: 88,
  },
];

export interface Supplier {
  id: string;
  name: string;
  region: string;
  reliability: number;
  quality: number;
  onTime: number;
  orders: number;
  avatar: string;
}

export const suppliers: Supplier[] = [
  {
    id: 's1',
    name: 'Johor Farm Cluster',
    region: 'Johor',
    reliability: 98,
    quality: 95,
    onTime: 97,
    orders: 42,
    avatar: 'https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg?auto=compress&w=120',
  },
  {
    id: 's2',
    name: 'Cameron Highland Growers',
    region: 'Pahang',
    reliability: 96,
    quality: 97,
    onTime: 94,
    orders: 31,
    avatar: 'https://images.pexels.com/photos/1112080/pexels-photo-1112080.jpeg?auto=compress&w=120',
  },
  {
    id: 's3',
    name: 'Perak Golden Fields',
    region: 'Perak',
    reliability: 93,
    quality: 91,
    onTime: 90,
    orders: 18,
    avatar: 'https://images.pexels.com/photos/1591939/pexels-photo-1591939.jpeg?auto=compress&w=120',
  },
];

export interface Sustainability {
  label: string;
  value: string;
  icon: string;
  detail: string;
}

export const sustainability: Sustainability[] = [
  { label: 'Reusable Boxes', value: '230', icon: 'PackageCheck', detail: 'This quarter' },
  { label: 'Food Waste Reduced', value: '18%', icon: 'Leaf', detail: 'vs industry average' },
  { label: 'Carbon Reduction', value: '85kg CO₂', icon: 'CloudOff', detail: 'Equivalent to 4 trees' },
];

export interface Order {
  id: string;
  product: string;
  supplier: string;
  quantity: string;
  status: 'Processing' | 'In Transit' | 'Delivered' | 'Scheduled';
  date: string;
  freshness: number;
}

export const orders: Order[] = [
  { id: 'FX-2041', product: 'Premium Tomatoes', supplier: 'Johor Farm Cluster', quantity: '500 kg', status: 'In Transit', date: '2026-07-23', freshness: 93 },
  { id: 'FX-2040', product: 'Organic Leafy Greens', supplier: 'Cameron Highland Growers', quantity: '320 kg', status: 'Processing', date: '2026-07-23', freshness: 96 },
  { id: 'FX-2039', product: 'Sweet Carrots', supplier: 'Perak Golden Fields', quantity: '780 kg', status: 'Scheduled', date: '2026-07-24', freshness: 94 },
  { id: 'FX-2038', product: 'Fresh Strawberries', supplier: 'Cameron Highland Growers', quantity: '120 kg', status: 'Delivered', date: '2026-07-22', freshness: 95 },
  { id: 'FX-2037', product: 'Crunchy Bell Peppers', supplier: 'Johor Farm Cluster', quantity: '450 kg', status: 'Delivered', date: '2026-07-21', freshness: 92 },
];

export const inventory = [
  { item: 'Tomatoes', stock: 120, unit: 'kg', reorder: 200, status: 'Low' },
  { item: 'Leafy Greens', stock: 85, unit: 'kg', reorder: 100, status: 'Low' },
  { item: 'Carrots', stock: 340, unit: 'kg', reorder: 150, status: 'OK' },
  { item: 'Bell Peppers', stock: 260, unit: 'kg', reorder: 120, status: 'OK' },
  { item: 'Strawberries', stock: 40, unit: 'kg', reorder: 80, status: 'Critical' },
  { item: 'Sweet Corn', stock: 410, unit: 'kg', reorder: 200, status: 'OK' },
];
