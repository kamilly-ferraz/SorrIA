import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/services/api/SupabaseClient';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  type: 'patient' | 'appointment' | 'stock' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  addNotification: (type: Notification['type'], title: string, message: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: Notification[] = data.map(n => ({
          id: n.id,
          type: n.tipo as Notification['type'],
          title: n.titulo,
          message: n.mensagem,
          timestamp: new Date(n.created_at),
          read: n.lida,
        }));
        setNotifications(mapped);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback(async (type: Notification['type'], title: string, message: string) => {
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .insert({
          tipo: type,
          titulo: title,
          mensagem: message,
          lida: false,
          usuario_id: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newNotification: Notification = {
          id: data.id,
          type: data.tipo as Notification['type'],
          title: data.titulo,
          message: data.mensagem,
          timestamp: new Date(data.created_at),
          read: data.lida,
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
    } catch (error) {
      console.error('Erro ao adicionar notificação:', error);
    }
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('lida', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .delete()
        .eq('lida', true);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => !n.read));
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  }, []);

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      refreshNotifications: fetchNotifications,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
