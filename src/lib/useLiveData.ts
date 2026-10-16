import { useCallback } from 'react';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Data connections are intentionally disabled in the standalone portal.
export function useLiveData<T>(_table: string, _select: string, _modifier?: unknown): QueryState<T[]> {
  const refetch = useCallback(async () => {}, []);
  return { data: null, loading: false, error: null, refetch };
}

export function useLiveSingle<T>(_table: string, _select: string, _match: Record<string, string>): QueryState<T> {
  const refetch = useCallback(async () => {}, []);
  return { data: null, loading: false, error: null, refetch };
}
