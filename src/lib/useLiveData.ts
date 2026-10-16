import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

type QueryModifier = (q: ReturnType<typeof supabase.from>) => any;

// Generic hook that fetches from a table and subscribes to realtime changes.
export function useLiveData<T>(
  table: string,
  select: string,
  modifier?: QueryModifier
): QueryState<T[]> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    let q: any = supabase.from(table).select(select);
    if (modifier) q = modifier(q);
    const { data, error } = await q;
    if (error) setError(error.message);
    else setData(data as T[]);
    setLoading(false);
  }, [table, select]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel(`live-${table}-${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchData())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, table]);

  return { data, loading, error, refetch: fetchData };
}

// Single-row live hook
export function useLiveSingle<T>(
  table: string,
  select: string,
  match: Record<string, string>
): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase.from(table).select(select).match(match).maybeSingle();
    if (error) setError(error.message);
    else setData(data as T);
    setLoading(false);
  }, [table, select, JSON.stringify(match)]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel(`live-single-${table}-${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchData())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, table]);

  return { data, loading, error, refetch: fetchData };
}
