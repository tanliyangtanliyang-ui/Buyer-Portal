import { LayoutDashboard, Carrot, Package, Users, Truck, Leaf, Sprout, Settings, Bell, Menu } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { BUYER_ID, initials, loadBuyerProfile, type BuyerProfile } from '@/lib/liveApi';
import { useOrderNotifications } from '@/lib/insights';

export type PageId =
  | 'dashboard'
  | 'browse'
  | 'orders'
  | 'suppliers'
  | 'tracking'
  | 'freshness'
  | 'settings';

const navItems: { id: PageId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'browse', label: 'Browse Produce', icon: Carrot },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'suppliers', label: 'Supplier Network', icon: Users },
  { id: 'tracking', label: 'Delivery Tracking', icon: Truck },
  { id: 'freshness', label: 'Freshness Monitoring', icon: Leaf },
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
          <p className="text-[11px] text-brand-100 leading-relaxed">Chilled and cool produce travels in refrigerated vehicles; drivers record cargo temperatures on the way.</p>
        </div>
      </aside>
    </>
  );
}

export function TopBar({ onMenu, title }: { onMenu: () => void; title: string }) {
  const { notes, unread: unreadCount, isRead, markAllRead } = useOrderNotifications();
  const [showNotif, setShowNotif] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  useEffect(() => { loadBuyerProfile().then(setProfile); }, []);

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
                  <p className="text-sm font-bold text-brand-800">Your order updates</p>
                  {unreadCount > 0 && (
                    <button onClick={() => markAllRead()} className="text-xs font-semibold text-brand-600 hover:text-brand-800">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notes.length === 0 && (
                    <p className="text-xs text-brand-400 px-4 py-6 text-center">No order updates yet. Hub decisions and deliveries for your orders appear here.</p>
                  )}
                  {notes.map((n) => (
                    <div key={n.id} className={`px-4 py-2.5 border-b border-brand-50 last:border-0 ${isRead(n.id) ? 'opacity-60' : ''}`} data-testid="order-note">
                      <p className={`text-xs font-semibold ${n.tone === 'warning' ? 'text-amber-700' : n.tone === 'success' ? 'text-brand-700' : 'text-brand-800'}`}>{n.title}</p>
                      <p className="text-[11px] text-brand-500 mt-0.5">{n.detail}</p>
                      <p className="text-[10px] text-brand-400 mt-0.5">{timeAgo(n.at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-white border border-brand-100 pl-1 pr-3 py-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold">
              {initials(profile?.name)}
            </div>
            <div className="hidden sm:block leading-tight" data-testid="buyer-identity">
              <p className="text-xs font-bold text-brand-800">{profile?.name ?? 'Buyer'}</p>
              <p className="text-[11px] text-brand-500 font-mono">{BUYER_ID}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
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
