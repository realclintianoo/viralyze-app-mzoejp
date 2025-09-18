
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { storage } from '../utils/storage';

export interface QuotaLimits {
  textRequests: number;
  imageRequests: number;
  maxTextRequests: number;
  maxImageRequests: number;
  isPro: boolean;
}

export const useQuota = () => {
  const { user, isGuest } = useAuth();
  const [quota, setQuota] = useState<QuotaLimits>({
    textRequests: 0,
    imageRequests: 0,
    maxTextRequests: 10, // Updated from 2 to 10
    maxImageRequests: 1,
    isPro: false,
  });
  const [loading, setLoading] = useState(true);

  const loadQuota = useCallback(async () => {
    try {
      if (isGuest) {
        // Load from local storage for guests
        const localQuota = await storage.getQuotaUsage();
        setQuota({
          textRequests: localQuota.text,
          imageRequests: localQuota.image,
          maxTextRequests: 10, // Updated from 2 to 10
          maxImageRequests: 1,
          isPro: false,
        });
      } else if (user) {
        // Load from database for authenticated users
        const today = new Date().toISOString().split('T')[0];
        
        const { data: usageData } = await supabase
          .from('usage_log')
          .select('kind, count')
          .eq('user_id', user.id)
          .eq('day', today);

        const textUsage = usageData?.find(u => u.kind === 'text')?.count || 0;
        const imageUsage = usageData?.find(u => u.kind === 'image')?.count || 0;

        // Check if user is Pro (this would come from a subscription table in real app)
        const isPro = false; // TODO: Implement Pro subscription check

        setQuota({
          textRequests: textUsage,
          imageRequests: imageUsage,
          maxTextRequests: isPro ? 999999 : 10, // Updated from 2 to 10
          maxImageRequests: isPro ? 999999 : 1,
          isPro,
        });
      }
    } catch (error) {
      console.error('Error loading quota:', error);
    } finally {
      setLoading(false);
    }
  }, [isGuest, user]);

  useEffect(() => {
    loadQuota();
  }, [loadQuota]);

  const incrementUsage = async (type: 'text' | 'image') => {
    try {
      if (isGuest) {
        // Update local storage for guests
        const currentQuota = await storage.getQuotaUsage();
        const newQuota = {
          ...currentQuota,
          [type]: currentQuota[type] + 1,
        };
        await storage.setQuotaUsage(newQuota);
        
        setQuota(prev => ({
          ...prev,
          [type === 'text' ? 'textRequests' : 'imageRequests']: 
            prev[type === 'text' ? 'textRequests' : 'imageRequests'] + 1,
        }));
      } else if (user) {
        // Update database for authenticated users
        const today = new Date().toISOString().split('T')[0];
        
        const { error } = await supabase
          .from('usage_log')
          .upsert({
            user_id: user.id,
            kind: type,
            day: today,
            count: quota[type === 'text' ? 'textRequests' : 'imageRequests'] + 1,
          });

        if (!error) {
          setQuota(prev => ({
            ...prev,
            [type === 'text' ? 'textRequests' : 'imageRequests']: 
              prev[type === 'text' ? 'textRequests' : 'imageRequests'] + 1,
          }));
        }
      }
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  };

  const canUseFeature = (type: 'text' | 'image'): boolean => {
    if (quota.isPro) return true;
    
    const current = type === 'text' ? quota.textRequests : quota.imageRequests;
    const max = type === 'text' ? quota.maxTextRequests : quota.maxImageRequests;
    
    return current < max;
  };

  const getRemainingUsage = (type: 'text' | 'image'): number => {
    if (quota.isPro) return 999999;
    
    const current = type === 'text' ? quota.textRequests : quota.imageRequests;
    const max = type === 'text' ? quota.maxTextRequests : quota.maxImageRequests;
    
    return Math.max(0, max - current);
  };

  return {
    quota,
    loading,
    incrementUsage,
    canUseFeature,
    getRemainingUsage,
    refreshQuota: loadQuota,
  };
};
