'use client';
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { SiteSettings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/products';

type SettingsContextType = {
  settings: SiteSettings;
  shippingFor: (subtotal: number) => number;
  loaded: boolean;
  mounted: boolean;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings?: SiteSettings;
}) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings || DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState<boolean>(!!initialSettings);
  const [mounted, setMounted] = useState<boolean>(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('settings').select('*');
    if (!error && data) {
      const next: any = { ...DEFAULT_SETTINGS };
      data.forEach((row: any) => {
        next[row.key] = row.value;
      });
      setSettings(next);
      setLoaded(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('dvero_settings_cache', JSON.stringify(next));
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    if (!initialSettings && typeof window !== 'undefined') {
      const cached = localStorage.getItem('dvero_settings_cache');
      if (cached) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(cached) });
          setLoaded(true);
        } catch (e) {}
      }
    }
    load();

    const syncHandler = () => {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('dvero_settings_cache');
        if (cached) {
          try {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(cached) });
          } catch (e) {}
        }
      }
      load();
    };

    window.addEventListener('dvero_settings_updated', syncHandler);

    const channel = supabase.channel(`storefront-settings-${Math.random().toString(36).slice(2)}`);
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, load);
    channel.subscribe();

    return () => {
      window.removeEventListener('dvero_settings_updated', syncHandler);
      supabase.removeChannel(channel);
    };
  }, [initialSettings, load]);

  function shippingFor(_subtotal: number): number {
    return 0;
  }

  return React.createElement(SettingsContext.Provider, { value: { settings, shippingFor, loaded, mounted } }, children);
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context) {
    return context;
  }

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('settings').select('*');
    if (!error && data) {
      const next: any = { ...DEFAULT_SETTINGS };
      data.forEach((row: any) => {
        next[row.key] = row.value;
      });
      setSettings(next);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('dvero_settings_cache');
      if (cached) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(cached) });
          setLoaded(true);
        } catch (e) {}
      }
    }
    load();
  }, [load]);

  function shippingFor(_subtotal: number): number {
    return 0;
  }

  return { settings, shippingFor, loaded, mounted };
}
