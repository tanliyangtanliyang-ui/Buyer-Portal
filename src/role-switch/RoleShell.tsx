import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ShoppingBasket, Sprout, Check, RefreshCw } from 'lucide-react';

// Unified FarmXpress portal shell: one role switcher in front of the two EXISTING portals.
// - Buyer mode renders the existing Buyer Portal app unchanged.
// - Farmer/Seller mode shows the existing Farmer Portal app unchanged, served by its own dev
//   server and displayed inside this page. It is kept in its own document because the two
//   portals' global stylesheets and Tailwind themes conflict; sharing one page would restyle
//   one of them. Only the active role's interface is mounted.
// This is a view selector, not sign-in or access control.

export type PortalRole = 'buyer' | 'farmer';
const STORAGE_KEY = 'fx.portal.role';
const ROLE_PARAM = 'role';
const FARMER_URL: string =
  import.meta.env.VITE_FARMER_PORTAL_URL ?? `${window.location.origin}/farmer/`;
const LABEL: Record<PortalRole, string> = { buyer: 'Buyer', farmer: 'Farmer/Seller' };

const parseRole = (v: string | null): PortalRole | null => (v === 'farmer' || v === 'buyer' ? v : null);
const roleFromUrl = () => parseRole(new URLSearchParams(window.location.search).get(ROLE_PARAM));
const readStored = () => { try { return parseRole(window.localStorage.getItem(STORAGE_KEY)); } catch { return null; } };
const store = (r: PortalRole) => { try { window.localStorage.setItem(STORAGE_KEY, r); } catch { /* storage unavailable */ } };
const urlFor = (r: PortalRole) => {
  const u = new URL(window.location.href);
  u.searchParams.set(ROLE_PARAM, r);
  return `${u.pathname}${u.search}${u.hash}`;
};

function useRole() {
  const [role, setRoleState] = useState<PortalRole>(() => roleFromUrl() ?? readStored() ?? 'buyer');
  useEffect(() => {
    // Record the starting role in the URL so refresh and back/forward stay consistent.
    window.history.replaceState({ role }, '', urlFor(role));
    store(role);
    const onPop = () => { const r = roleFromUrl() ?? 'buyer'; setRoleState(r); store(r); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const current = useRef(role);
  current.current = role;
  const setRole = useCallback((r: PortalRole) => {
    if (current.current === r) return;
    window.history.pushState({ role: r }, '', urlFor(r));
    store(r);
    setRoleState(r);
    window.scrollTo({ top: 0 });
  }, []);
  useEffect(() => { document.title = `FarmXpress — ${LABEL[role]}`; }, [role]);
  return [role, setRole] as const;
}

function RoleSwitcher({ role, onChange }: { role: PortalRole; onChange: (r: PortalRole) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const Icon = role === 'buyer' ? ShoppingBasket : Sprout;
  const item = (r: PortalRole, text: string, ItemIcon: typeof Sprout) => (
    <button
      type="button"
      role="menuitem"
      disabled={role === r}
      onClick={() => { setOpen(false); onChange(r); }}
      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-lg text-slate-700 hover:bg-brand-50 disabled:text-slate-400 disabled:hover:bg-transparent"
    >
      <ItemIcon className="w-4 h-4" />
      <span className="flex-1">{text}</span>
      {role === r && <Check className="w-4 h-4 text-brand-600" />}
    </button>
  );
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl bg-white text-brand-800 px-3 py-1.5 text-sm font-semibold shadow-sm hover:bg-brand-50"
        data-testid="role-switcher"
      >
        <Icon className="w-4 h-4" />
        Current role: {LABEL[role]}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/5 z-[60]">
          {item('farmer', 'Switch to Farmer/Seller', Sprout)}
          {item('buyer', 'Switch to Buyer', ShoppingBasket)}
        </div>
      )}
    </div>
  );
}

function RoleBar({ role, onChange }: { role: PortalRole; onChange: (r: PortalRole) => void }) {
  return (
    <div className="h-12 shrink-0 bg-brand-800 text-white px-4 lg:px-6 flex items-center gap-3 relative z-50">
      <span className="font-bold tracking-tight">FarmXpress</span>
      <span className="hidden sm:inline text-xs text-white/70">Unified Buyer &amp; Farmer portal</span>
      <div className="ml-auto"><RoleSwitcher role={role} onChange={onChange} /></div>
    </div>
  );
}

// The Farmer portal always loads in the frame. A background check only adds a hint when the
// Farmer dev server cannot be confirmed; it never blocks the frame (some browsers and
// extensions filter cross-port requests even when framing works).
function FarmerPortalFrame() {
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [hint, setHint] = useState(false);
  useEffect(() => {
    let active = true;
    setLoaded(false); setHint(false);
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 5000);
    // An opaque no-cors response still proves the Farmer Portal server is up.
    fetch(FARMER_URL, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal })
      .catch(() => { if (active) setHint(true); })
      .finally(() => window.clearTimeout(timer));
    return () => { active = false; ctrl.abort(); window.clearTimeout(timer); };
  }, [attempt]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {hint && (
        <div className="shrink-0 flex flex-wrap items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900" role="alert">
          <span>Could not confirm the Farmer/Seller portal at <span className="font-mono">{FARMER_URL}</span>. If the area below stays empty, start all portals with <span className="font-mono">scripts\dev-all.ps1</span>.</span>
          <button type="button" onClick={() => setAttempt((a) => a + 1)} className="ml-auto inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 font-semibold border border-amber-300 hover:bg-amber-100"><RefreshCw className="w-3 h-3" />Reload</button>
          <button type="button" onClick={() => setHint(false)} className="rounded-lg px-2 py-1 font-semibold hover:bg-amber-100" aria-label="Dismiss">Dismiss</button>
        </div>
      )}
      <div className="flex-1 relative min-h-0">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-cream text-sm text-brand-700" role="status">Loading Farmer/Seller portal…</div>
        )}
        <iframe
          key={attempt}
          src={FARMER_URL}
          title="FarmXpress Farmer/Seller portal"
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 w-full h-full border-0 bg-white"
          data-testid="farmer-portal-frame"
        />
      </div>
    </div>
  );
}

export default function RoleShell({ buyer }: { buyer: ReactNode }) {
  const [role, setRole] = useRole();
  if (role === 'farmer') {
    return (
      <div className="h-screen flex flex-col overflow-hidden" data-active-role="farmer">
        <RoleBar role={role} onChange={setRole} />
        <FarmerPortalFrame />
      </div>
    );
  }
  return (
    <div data-active-role="buyer">
      <RoleBar role={role} onChange={setRole} />
      {buyer}
    </div>
  );
}
