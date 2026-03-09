import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SystemEvent {
  id: string;
  entity_type: string;
  entity_id: string | null;
  event_type: string;
  actor_id: string | null;
  metadata: any;
  created_at: string;
}

interface EventFilters {
  entity_type?: string;
  event_type?: string;
  limit?: number;
}

export function useSystemEvents(filters?: EventFilters) {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('system_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 50);

      if (filters?.entity_type) query = query.eq('entity_type', filters.entity_type);
      if (filters?.event_type) query = query.eq('event_type', filters.event_type);

      const { data, error } = await query;
      if (error) throw error;
      setEvents((data || []) as SystemEvent[]);
    } catch (error) {
      console.error('Error fetching system events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [filters?.entity_type, filters?.event_type, filters?.limit]);

  return { events, loading, refetch: fetchEvents };
}
