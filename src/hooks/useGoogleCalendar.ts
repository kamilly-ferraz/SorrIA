 import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'vwbjkwztvmdxomltjmso';
const BASE_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/google-calendar`;

export function useGoogleCalendar() {
  const { session } = useAuth();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const headers = useCallback(() => ({
    'Authorization': `Bearer ${session?.access_token}`,
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    'Content-Type': 'application/json',
  }), [session?.access_token]);

  const checkStatus = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    try {
      const res = await fetch(`${BASE_URL}/status`, {
        method: 'GET',
        headers: headers(),
      });
      if (res.ok) {
        const d = await res.json();
        setConnected(d.connected);
      }
    } catch (err) {
      logger.error('GCal status check failed:', err);
    }
    setLoading(false);
  }, [session, headers]);

  useEffect(() => {
    checkStatus();

    const handler = (e: MessageEvent) => {
      if (e.data === 'gcal-connected') {
        setConnected(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [checkStatus]);

  const connect = async () => {
    if (!session) return;
    try {
      const res = await fetch(`${BASE_URL}/auth-url`, {
        headers: headers(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.url) {
          // Google OAuth requer popup separado
          window.open(data.url, '_blank', 'width=500,height=700,noopener');
        }
      } else {
        const err = await res.text();
        logger.error('Failed to get auth URL:', res.status, err);
      }
    } catch (err) {
      logger.error('Failed to get Google auth URL:', err);
    }
  };

  const disconnect = async () => {
    if (!session) return;
    try {
      await fetch(`${BASE_URL}/disconnect`, {
        method: 'POST',
        headers: headers(),
      });
      setConnected(false);
    } catch (err) {
      logger.error('Failed to disconnect:', err);
    }
  };

  const createEvent = async (eventData: {
    patient_name: string;
    procedure_name: string;
    office_name: string;
    date: string;
    time: string;
    duration: number;
    notes?: string;
  }) => {
    const res = await fetch(`${BASE_URL}/create-event`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(eventData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data?.event_id;
  };

  const updateEvent = async (eventData: {
    event_id: string;
    patient_name?: string;
    procedure_name?: string;
    date?: string;
    time?: string;
    duration?: number;
  }) => {
    await fetch(`${BASE_URL}/update-event`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(eventData),
    });
  };

  const deleteEvent = async (eventId: string) => {
    await fetch(`${BASE_URL}/delete-event`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ event_id: eventId }),
    });
  };

  return { connected, loading, connect, disconnect, createEvent, updateEvent, deleteEvent, checkStatus };
}
