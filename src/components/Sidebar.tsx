import { LayoutDashboard, Carrot, Package, Users, Truck, Leaf, Boxes, BrainCircuit, BarChart3, Sprout, Settings, Bell, Search, Menu } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useEvents, severityStyles } from '@/lib/eventBus';
import type { FarmEvent } from '@/lib/types';

export type PageId =
  | 'dashboard'
  | 'browse'
  | 'orders'
  | 'suppliers'
  | 'tracking'
  | 'freshness'
  | 'inventory'
  | 'forecast'
  | 'reports'
  | 'sustainability'
  | 'settings';

const navItems: { id: PageId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'browse', label: 'Browse Produce', icon: Carrot },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'suppliers', label: 'Supplier Network', icon: Users },
  { id: 'tracking', label: 'Delivery Tracking', icon: Truck },
  { id: 'freshness', label: 'Freshness Monitoring', icon: Leaf },
  { id: 'inventory', label: 'Inventory Planning', icon: Boxes },
  { id: 'forecast', label: 'AI Demand Forecast', icon: BrainCircuit },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'sustainability', label: 'Sustainability', icon: Sprout },
  { id: 'settings', label: 'Account Settings', icon: Settings },
];

export default function Sidebar({
  page,
  setPage,
  open,
  setOpen,
}: {
  page: PageId;
  setPage: (p: PageId) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
}) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-brand-900/30 z-30 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-72 shrink-0 bg-white border-r border-brand-100 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-6 flex items-center gap-3 border-b border-brand-100">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-soft">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-display font-extrabold text-brand-800 leading-none">FarmXpress</p>
            <p className="text-xs text-brand-600 font-semibold mt-0.5">Buyer Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setPage(item.id);
                  setOpen(false);
                }}
                className={`nav-item w-full ${active ? 'nav-item-active' : 'nav-item-idle'}`}
              >
                <Icon className={`w-[18px] h-[18px] ${active ? 'text-white' : 'text-brand-600'}`} />
                <span>{item.label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />}
              </button>
            );
          })}
        </nav>

        {/* Trust banner */}
        <div className="m-3 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white">
          <div className="flex items-center gap-2 mb-1.5">
            <Leaf className="w-4 h-4" />
            <p className="text-xs font-bold">Freshness guaranteed</p>
          </div>
          <p className="text-[11px] text-brand-100 leading-relaxed">From farm to business, every shipment is cold-chain verified.</p>
        </div>
      </aside>
    </>
  );
}

export function TopBar({ onMenu, title }: { onMenu: () => void; title: string }) {
  const { events, unreadCount, markAllRead } = useEvents();
  const [showNotif, setShowNotif] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-cream/80 backdrop-blur-md border-b border-brand-100">
      <div className="flex items-center gap-3 px-4 lg:px-8 py-3.5">
        <button onClick={onMenu} className="lg:hidden w-9 h-9 rounded-xl bg-white border border-brand-100 flex items-center justify-center text-brand-700">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:block">
          <h1 className="font-display text-lg font-bold text-brand-800">{title}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-white border border-brand-100 px-3 py-2 w-56">
            <Search className="w-4 h-4 text-brand-400" />
            <input
              placeholder="Search produce, orders…"
              className="bg-transparent outline-none text-sm w-full text-brand-800 placeholder:text-brand-400"
            />
          </div>
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setShowNotif((s) => !s)}
              className="w-9 h-9 rounded-xl bg-white border border-brand-100 flex items-center justify-center text-brand-700 hover:bg-brand-50 transition relative"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 ring-2 ring-cream flex items-center justify-center text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 card p-0 z-30 animate-fade-up overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-brand-50">
                  <p className="text-sm font-bold text-brand-800">Cross-Module Events</p>
                  {unreadCount > 0 && (
                    <button onClick={() => markAllRead()} className="text-xs font-semibold text-brand-600 hover:text-brand-800">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {events.length === 0 && (
                    <p className="text-xs text-brand-400 px-4 py-6 text-center">No events yet. Simulated events will arrive shortly.</p>
                  )}
                  {events.slice(0, 20).map((e) => <NotificationRow key={e.id} event={e} />)}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-white border border-brand-100 pl-1 pr-3 py-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold">
              FM
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-xs font-bold text-brand-800">FreshMart</p>
              <p className="text-[11px] text-brand-500 font-mono">BUY-001</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function NotificationRow({ event }: { event: FarmEvent }) {
  const style = severityStyles[event.severity];
  const ago = timeAgo(event.created_at);
  return (
    <div className={`px-4 py-2.5 border-b border-brand-50 last:border-0 ${event.read ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-2">
        <span className="text-base shrink-0 mt-0.5">{style.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: style.text.replace('text-', '') === 'sky-700' ? '#0369a1' : style.text.replace('text-', '') === 'amber-700' ? '#b45309' : style.text.replace('text-', '') === 'red-700' ? '#b91c1c' : '#15803d' }}>
            {event.source_module}
          </p>
          <p className="text-xs font-semibold text-brand-800 leading-snug mt-0.5">{event.message}</p>
          <p className="text-[10px] text-brand-400 mt-1">{ago}{event.entity_code && ` · ${event.entity_code}`}</p>
        </div>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}
