import { useState } from 'react';
import Sidebar, { TopBar, type PageId } from '@/components/Sidebar';
import OverviewCards from '@/components/sections/OverviewCards';
import ProduceMarketplace from '@/components/sections/ProduceMarketplace';
import Traceability from '@/components/sections/Traceability';
import FreshnessIntelligence from '@/components/sections/FreshnessIntelligence';
import DemandForecast from '@/components/sections/DemandForecast';
import DeliveryTracking from '@/components/sections/DeliveryTracking';
import SupplierNetwork from '@/components/sections/SupplierNetwork';
import Sustainability from '@/components/sections/Sustainability';
import { OrdersPage, InventoryPage, ReportsPage, SettingsPage } from '@/components/sections/MiscPages';
import { EventProvider } from '@/lib/eventBus';
import { useEventSimulator } from '@/lib/simulator';
import ToastStack from '@/components/ToastStack';

const pageTitles: Record<PageId, string> = {
  dashboard: 'Buyer Dashboard',
  browse: 'Browse Produce',
  orders: 'My Orders',
  suppliers: 'Supplier Network',
  tracking: 'Delivery Tracking',
  freshness: 'Freshness Monitoring',
  inventory: 'Inventory Planning',
  forecast: 'AI Demand Forecast',
  reports: 'Reports & Analytics',
  sustainability: 'Sustainability',
  settings: 'Account Settings',
};

function Dashboard({ setPage }: { setPage: (p: PageId) => void }) {
  return (
    <div className="space-y-8">
      {/* Hero banner */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <p className="text-xs font-bold text-brand-100 uppercase tracking-wider mb-1">Welcome back, FreshMart</p>
          <h2 className="font-display text-2xl lg:text-3xl font-extrabold mb-2">Freshness guaranteed from farm to business.</h2>
          <p className="text-sm text-brand-100 max-w-lg">Your procurement hub for verified produce, real-time freshness tracking, and AI-powered demand forecasting — synced across all FarmXpress modules.</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <button onClick={() => setPage('browse')} className="rounded-xl bg-white text-brand-700 px-4 py-2 text-sm font-bold hover:bg-brand-50 transition">Browse Produce</button>
            <button onClick={() => setPage('forecast')} className="rounded-xl bg-white/15 backdrop-blur text-white px-4 py-2 text-sm font-semibold hover:bg-white/25 transition">View AI Forecast</button>
          </div>
        </div>
      </div>

      <OverviewCards setPage={setPage} />
      <ProduceMarketplace />
      <Traceability />
      <div className="grid lg:grid-cols-2 gap-8">
        <FreshnessIntelligence />
        <DemandForecast />
      </div>
      <DeliveryTracking />
      <SupplierNetwork />
      <Sustainability />
    </div>
  );
}

function SimulatorHost() {
  useEventSimulator();
  return null;
}

export default function App() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <EventProvider>
      <SimulatorHost />
      <div className="min-h-screen bg-cream flex">
        <Sidebar page={page} setPage={setPage} open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="flex-1 min-w-0 flex flex-col">
          <TopBar onMenu={() => setSidebarOpen(true)} title={pageTitles[page]} />
          <main className="flex-1 px-4 lg:px-8 py-6">
            {page === 'dashboard' && <Dashboard setPage={setPage} />}
            {page === 'browse' && <ProduceMarketplace />}
            {page === 'orders' && <OrdersPage />}
            {page === 'suppliers' && <SupplierNetwork />}
            {page === 'tracking' && <DeliveryTracking />}
            {page === 'freshness' && (
              <div className="space-y-8">
                <FreshnessIntelligence />
                <Traceability />
              </div>
            )}
            {page === 'inventory' && <InventoryPage />}
            {page === 'forecast' && <DemandForecast />}
            {page === 'reports' && <ReportsPage />}
            {page === 'sustainability' && <Sustainability />}
            {page === 'settings' && <SettingsPage />}
          </main>
          <footer className="px-4 lg:px-8 py-5 text-center text-xs text-brand-400 border-t border-brand-50">
            FarmXpress Buyer Portal · Part of the FarmXpress ecosystem · Freshness guaranteed from farm to business.
          </footer>
        </div>
      </div>
      <ToastStack />
    </EventProvider>
  );
}
