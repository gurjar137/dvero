'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthContext';
import { FitProfile } from './types';

const LOCAL_STORAGE_KEY = 'dvero_fit_profile';

export function useFitProfile() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<FitProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Load profile from Supabase or localStorage
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      if (session?.user) {
        const { data, error } = await supabase
          .from('fit_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (data && !error) {
          setProfile({
            height_cm: Number(data.height_cm),
            weight_kg: Number(data.weight_kg),
            age: Number(data.age || 28),
            gender: data.gender || 'male',
            body_type: data.body_type || 'regular',
            chest: data.chest ? Number(data.chest) : undefined,
            shoulder: data.shoulder ? Number(data.shoulder) : undefined,
            neck: data.neck ? Number(data.neck) : undefined,
            current_waist: data.current_waist ? Number(data.current_waist) : undefined,
            current_trouser_length: data.current_trouser_length ? Number(data.current_trouser_length) : undefined,
            hip: data.hip ? Number(data.hip) : undefined,
            preferred_rise: data.preferred_rise,
            fit_preference: data.fit_preference,
            current_fit_feedback: data.current_fit_feedback,
          });
          setLoading(false);
          return;
        }
      }

      // Fallback to localStorage for guest or initial load
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setProfile(parsed);
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    } catch (err) {
      console.warn('Error loading fit profile:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Save profile to Supabase and localStorage
  const saveProfile = async (newProfile: FitProfile): Promise<boolean> => {
    setSaving(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newProfile));
      }
      setProfile(newProfile);

      if (session?.user) {
        const { error } = await supabase.from('fit_profiles').upsert(
          {
            user_id: session.user.id,
            height_cm: newProfile.height_cm,
            weight_kg: newProfile.weight_kg,
            age: newProfile.age,
            gender: newProfile.gender,
            body_type: newProfile.body_type,
            chest: newProfile.chest || null,
            shoulder: newProfile.shoulder || null,
            neck: newProfile.neck || null,
            current_waist: newProfile.current_waist || null,
            current_trouser_length: newProfile.current_trouser_length || null,
            hip: newProfile.hip || null,
            preferred_rise: newProfile.preferred_rise || null,
            fit_preference: newProfile.fit_preference || null,
            current_fit_feedback: newProfile.current_fit_feedback || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        if (error) {
          console.warn('Supabase profile save notice:', error.message);
        }
      }
      return true;
    } catch (err) {
      console.error('Failed to save fit profile:', err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    loading,
    saving,
    saveProfile,
    loadProfile,
  };
}
