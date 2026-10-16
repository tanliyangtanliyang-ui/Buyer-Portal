import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase } from './supabase';
import type { FarmEvent, EventSeverity } from './types';

interface EventContextValue {
  events: FarmEvent[];
  unreadCount: number;
  toasts: FarmEvent[];
  dismissToast: (id: string) => void;
  markAllRead: () => Promise<void>;
  publish: (e: Omit<FarmEvent, 'id' | 'created_at' | 'read'>) => Promise<void>;
  loading: boolean;
}

const EventContext = createContext<EventContextValue | null>(null);

export function useEvents() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvents must be used within EventProvider');
  return ctx;
}

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<FarmEvent[]>([]);
  const [toasts, setToasts] = useState<FarmEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const seenIds = useRef<Set<string>>(new Set());

  // Initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (mounted && data) {
        setEvents(data as FarmEvent[]);
        data.forEach((e) => seenIds.current.add(e.id));
      }
      setLoading(false);
    })();

    // Realtime subscription
    const channel = supabase
      .channel('farmxpress-events')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        (payload) => {
          const newEvent = payload.new as FarmEvent;
          if (seenIds.current.has(newEvent.id)) return;
          seenIds.current.add(newEvent.id);
          setEvents((prev) => [newEvent, ...prev].slice(0, 100));
          // Only toast events that aren't from the Buyer Portal itself (cross-module) or important
          setToasts((prev) => [...prev, newEvent].slice(-5));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAllRead = useCallback(async () => {
    await supabase.from('events').update({ read: true }).eq('read', false);
    setEvents((prev) => prev.map((e) => ({ ...e, read: true })));
  }, []);

  const publish = useCallback(async (e: Omit<FarmEvent, 'id' | 'created_at' | 'read'>) => {
    await supabase.from('events').insert({
      event_type: e.event_type,
      source_module: e.source_module,
      entity_type: e.entity_type,
      entity_id: e.entity_id,
      entity_code: e.entity_code,
      payload: e.payload,
      severity: e.severity,
      message: e.message,
    });
  }, []);

  const unreadCount = events.filter((e) => !e.read).length;

  return (
    <EventContext.Provider value={{ events, unreadCount, toasts, dismissToast, markAllRead, publish, loading }}>
      {children}
    </EventContext.Provider>
  );
}

export const severityStyles: Record<EventSeverity, { bg: string; text: string; border: string; icon: string }> = {
  info: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: 'ℹ️' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '⚠️' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '🚨' },
  success: { bg: 'bg-brand-50', text: 'text-brand-700', border: 'border-brand-200', icon: '✅' },
};
