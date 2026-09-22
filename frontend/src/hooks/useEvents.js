import { useCallback, useEffect, useState } from 'react';
import { listEvents } from '../api';

const EVENT_LIMIT = 9;

export function useEvents(initialFilters = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const load = useCallback(async (nextFilters, page) => {
    setLoading(true);
    setError('');
    try {
      // `when=past` lists finished events newest-first; otherwise only upcoming ones.
      const { when, ...rest } = nextFilters;
      const now = new Date().toISOString();
      const range = when === 'past' ? { to: now, sort: 'desc' } : { from: now };
      const payload = await listEvents({ ...range, ...rest, page, limit: EVENT_LIMIT });
      setEvents(payload.data.events);
      setPagination(payload.pagination);
      setFilters(nextFilters);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(initialFilters, 1);
    // Only re-run when the URL-provided filters change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, JSON.stringify(initialFilters)]);

  return {
    events,
    loading,
    error,
    filters,
    pagination,
    search: (nextFilters) => load(nextFilters, 1),
    goToPage: (page) => load(filters, page),
  };
}
