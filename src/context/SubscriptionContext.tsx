// src/context/SubscriptionContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { PLAN_LIMITS, PlanTier, PlanFeatures } from '../lib/plans'; // Import PlanFeatures

interface SubscriptionState {
  plan: PlanTier;
  limits: PlanFeatures; // Use the explicit interface here
  siteSlots: {
    total: number;
    used: number;
    remaining: number;
  };
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionState | null>(null);

export const SubscriptionProvider = ({ children, actorId }: { children: React.ReactNode, actorId?: string }) => {
  const [state, setState] = useState<SubscriptionState>({
    plan: 'starter',
    limits: PLAN_LIMITS.starter.features,
    siteSlots: { total: 3, used: 0, remaining: 3 },
    isLoading: true,
    refreshSubscription: async () => {} 
  });

  const loadSubscription = async () => {
    if (!actorId) {
        setState(s => ({ ...s, isLoading: false }));
        return;
    }

    try {
      const { data: subData } = await supabase.from('subscriptions')
        .select('plan_id')
        .eq('actor_id', actorId)
        .eq('status', 'active')
        .gt('current_period_end', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let planId: PlanTier = 'starter';
      if (subData?.plan_id) {
          const pid = subData.plan_id.toLowerCase();
          if (pid.includes('agency') || pid.includes('pro')) planId = 'pro';
          else if (pid.includes('ecommerce') || pid.includes('store')) planId = 'ecommerce';
          else planId = 'starter';
      }

      // Safe access using the typed object
      const config = PLAN_LIMITS[planId] || PLAN_LIMITS.starter;

      const { data: actorData } = await supabase.from('actors')
        .select('purchased_portfolio_slots')
        .eq('id', actorId)
        .single();
      
      const { count: usedCount } = await supabase.from('portfolios')
        .select('*', { count: 'exact', head: true })
        .eq('actor_id', actorId);

      const totalSlots = 3 + (actorData?.purchased_portfolio_slots || 0); 
      
      setState({
        plan: planId,
        limits: config.features,
        siteSlots: {
          total: totalSlots,
          used: usedCount || 0,
          remaining: Math.max(0, totalSlots - (usedCount || 0))
        },
        isLoading: false,
        refreshSubscription: loadSubscription
      });

    } catch (err) {
      console.error("Sub Context Error", err);
      setState(s => ({ ...s, isLoading: false }));
    }
  };

  useEffect(() => {
    loadSubscription();
  }, [actorId]);

  return (
    <SubscriptionContext.Provider value={state}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error("useSubscription must be used within Provider");
  return context;
};