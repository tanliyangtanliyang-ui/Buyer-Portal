import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { FarmEvent, EventSeverity } from './types';

interface EventContextValue {
  events: FarmEvent[];
  unreadCount: number;
  toasts: FarmEvent[];
  dismissToast: (id: string) => void;
  markAllRead: () => Promise<void>;
  publish: (event: Omit<FarmEvent, 'id' | 'created_at' | 'read'>) => Promise<void>;
  loading: boolean;
}
const EventContext = createContext<EventContextValue | null>(null);
export function useEvents() { const ctx = useContext(EventContext); if (!ctx) throw new Error('useEvents must be used within EventProvider'); return ctx; }
export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<FarmEvent[]>([]);
  const [toasts, setToasts] = useState<FarmEvent[]>([]);
  const dismissToast = useCallback((id: string) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  const markAllRead = useCallback(async () => setEvents((items) => items.map((item) => ({ ...item, read: true }))), []);
  const publish = useCallback(async (event: Omit<FarmEvent, 'id' | 'created_at' | 'read'>) => {
    const item: FarmEvent = { ...event, id: crypto.randomUUID(), created_at: new Date().toISOString(), read: false };
    setEvents((items) => [item, ...items].slice(0, 100)); setToasts((items) => [...items, item].slice(-5));
  }, []);
  const unreadCount = events.filter((item) => !item.read).length;
  return <EventContext.Provider value={{ events, unreadCount, toasts, dismissToast, markAllRead, publish, loading: false }}>{children}</EventContext.Provider>;
}
export const severityStyles: Record<EventSeverity, { bg: string; text: string; border: string; icon: string }> = {
  info: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: 'ℹ️' }, warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '⚠️' }, critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '🚨' }, success: { bg: 'bg-brand-50', text: 'text-brand-700', border: 'border-brand-200', icon: '✅' },
};
