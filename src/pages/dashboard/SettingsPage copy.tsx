import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ActorDashboardContextType } from '../../layouts/ActorDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Globe, User, Plus, ExternalLink, LayoutTemplate, Check, CreditCard, ArrowUpRight, Coins, Gift, AlertTriangle, CalendarDays, Clock, Trash2, Star, Sparkles, Building2, MessageCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { PORTFOLIO_TEMPLATES } from '../../lib/templates';
import { cn } from "@/lib/utils";
import { NotificationContainer, Notification } from '@/components/ui/NotificationToast'; // Update path if needed

// --- CONFIGURATION ---

const PLANS = [
    { 
        id: 'starter', 
        tier: 1, 
        name: 'Starter', 
        features: ['1 Website', 'Standard Support', 'UCP Branding'],
        monthly: { stripePriceId: 'price_1Sluys00hAkAJqU5VCvuFIet', stripeCost: 2.50, coinCost: 125, label: null },
        yearly: { stripePriceId: 'price_STARTER_YEARLY', stripeCost: 28.50, coinCost: 1425, label: '5% OFF' }
    },
    { 
        id: 'pro', 
        tier: 2, 
        name: 'Pro', 
        popular: true, 
        features: ['3 Websites', 'Custom Domain', 'No Branding', 'SEO Tools'],
        monthly: { stripePriceId: 'price_PRO_MONTHLY', stripeCost: 5.00, coinCost: 250, label: null },
        yearly: { stripePriceId: 'price_PRO_YEARLY', stripeCost: 54.00, coinCost: 2700, label: '10% OFF' }
    },
    { 
        id: 'agency', 
        tier: 3, 
        name: 'Agency', 
        features: ['Unlimited Sites', 'Priority Support', 'White Label', 'API Access'],
        monthly: { stripePriceId: 'price_AGENCY_MONTHLY', stripeCost: 15.00, coinCost: 750, label: null },
        yearly: { stripePriceId: 'price_AGENCY_YEARLY', stripeCost: 153.00, coinCost: 7650, label: '15% OFF' }
    },
];

const COIN_PACKS = [
    { id: 'handful', name: 'Handful of Coins', coins: 250, cost: 5, bonus: '', rarity: 3 },
    { id: 'bag', name: 'Bag of Coins', coins: 550, cost: 10, bonus: '+50 Free!', popular: true, rarity: 4 },
    { id: 'chest', name: 'Chest of Coins', coins: 1200, cost: 20, bonus: '+200 Free!', rarity: 5 },
    { id: 'handful_lg', name: 'Sack of Coins', coins: 1500, cost: 26, bonus: '+200 Free!', rarity: 4 },
    { id: 'bag_lg', name: 'Treasury', coins: 3000, cost: 54, bonus: '+300 Free!', popular: true, rarity: 5 },
    { id: 'chest_lg', name: 'Vault of Coins', coins: 8000, cost: 153, bonus: '+350 Free!', rarity: 5 },
];

const SettingsPage = () => {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({});
  const [walletBalance, setWalletBalance] = useState(0);
  const [subscriptions, setSubscriptions] = useState<Record<string, any>>({}); 
  const [transactions, setTransactions] = useState<any[]>([]);

  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false); 
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false); 
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null); 
  
  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Upgrade Modal UI State
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  const [selectedTemplate, setSelectedTemplate] = useState<string>(PORTFOLIO_TEMPLATES[0].id);
  const [newSiteName, setNewSiteName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false); 
  
  // Redeem State
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  // --- NEW: Notification State ---
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // --- NEW: Confirmation Dialog State ---
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: React.ReactNode; action: () => void; confirmText?: string; isDestructive?: boolean } | null>(null);

  const notify = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, type, title, message }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  // Helper to open custom confirmation dialog
  const openConfirmation = (title: string, message: React.ReactNode, action: () => void, confirmText = "Confirm", isDestructive = false) => {
      setConfirmDialog({ isOpen: true, title, message, action, confirmText, isDestructive });
  };

  const fetchData = async () => {
    if (!actorData?.id) return;
    setLoading(true);

    const { data: sites } = await supabase.from('portfolios').select('*').eq('actor_id', actorData.id).order('created_at', { ascending: false });
    if (sites) setPortfolios(sites);

    const { data: actor } = await supabase.from('actors').select('*').eq('id', actorData.id).single();
    if (actor) {
        setProfile(actor);
        setWalletBalance(actor.wallet_balance || 0);
    }

    const { data: subs } = await supabase.from('subscriptions').select('*').eq('actor_id', actorData.id);
    if (subs) {
        const subMap: Record<string, any> = {};
        subs.forEach(s => subMap[s.portfolio_id] = s);
        setSubscriptions(subMap);
    }

    const { data: txs } = await supabase.from('wallet_transactions').select('*').eq('actor_id', actorData.id).order('created_at', { ascending: false }).limit(5);
    if (txs) setTransactions(txs);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [actorData.id]);

  // --- HELPER: CALCULATE PRORATION ---
  const calculateProration = (targetPlanId: string) => {
    if (!selectedPortfolioId || !subscriptions[selectedPortfolioId]) return { cost: 0, isUpgrade: true, unusedValue: 0 };

    const currentSub = subscriptions[selectedPortfolioId];
    if (currentSub.payment_method === 'stripe') return { cost: 0, isUpgrade: true, unusedValue: 0, isStripe: true };

    const currentPlan = PLANS.find(p => p.id === currentSub.plan_id);
    const targetPlan = PLANS.find(p => p.id === targetPlanId);
    
    if (!currentPlan || !targetPlan) return { cost: 0, isUpgrade: true, unusedValue: 0 };

    const isUpgrade = targetPlan.tier > currentPlan.tier;
    const isDowngrade = targetPlan.tier < currentPlan.tier;
    const isSame = targetPlan.tier === currentPlan.tier;

    const now = new Date();
    const endDate = new Date(currentSub.current_period_end);
    
    if (now > endDate) return { cost: targetPlan[billingInterval].coinCost, isUpgrade: true, unusedValue: 0 };

    const totalDuration = new Date(endDate).getTime() - new Date(currentSub.current_period_start).getTime();
    const remainingDuration = endDate.getTime() - now.getTime();
    const percentageRemaining = Math.max(0, remainingDuration / totalDuration);

    const originalCost = currentPlan[billingInterval].coinCost; 
    const unusedValue = Math.floor(originalCost * percentageRemaining);

    let finalCost = targetPlan[billingInterval].coinCost;
    
    if (isUpgrade) {
        finalCost = Math.max(0, finalCost - unusedValue); 
    }

    return { 
        cost: finalCost, 
        originalPrice: targetPlan[billingInterval].coinCost,
        unusedValue, 
        isUpgrade,
        isDowngrade,
        isSame
    };
  };

  // --- ACTIONS ---

  const handleCreateSite = async () => {
      if (!newSiteName.trim()) { notify('error', "Missing Name", "Please enter a site name"); return; }
      if (!actorData?.id) return;

      setIsCreating(true);
      const template = PORTFOLIO_TEMPLATES.find(t => t.id === selectedTemplate) || PORTFOLIO_TEMPLATES[0];
      const baseSlug = newSiteName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

      const { error } = await supabase.from('portfolios').insert({
          actor_id: actorData.id,
          site_name: newSiteName,
          public_slug: uniqueSlug,
          is_published: false, 
          sections: template.sections,
          theme_config: { templateId: 'modern', primaryColor: 'violet', font: 'sans' }
      });

      if (error) notify('error', "Creation Failed", "Could not create website. Please try again.");
      else { 
          notify('success', "Website Created", `Your new site "${newSiteName}" is ready.`); 
          setIsCreateOpen(false); 
          setNewSiteName(""); 
          fetchData(); 
      }
      setIsCreating(false);
  };

  const handleDeleteSite = async () => {
    if (!selectedPortfolioId) return;
    const site = portfolios.find(p => p.id === selectedPortfolioId);
    
    if (deleteConfirmationName !== site?.site_name) {
        notify('error', "Name Mismatch", "Website name does not match. Please type it exactly.");
        return;
    }

    setIsDeleting(true);
    const { error } = await supabase.from('portfolios').delete().eq('id', selectedPortfolioId);
    
    if (error) {
        notify('error', "Deletion Failed", error.message);
    } else {
        notify('success', "Website Deleted", "The website and its data have been removed.");
        setIsDeleteOpen(false);
        setDeleteConfirmationName("");
        fetchData();
    }
    setIsDeleting(false);
  };

  const handleUpdateProfile = async () => {
      if (!actorData?.id) return;
      setIsSaving(true);
      const { error } = await supabase.from('actors').update({ ActorName: profile.ActorName, bio: profile.bio }).eq('id', actorData.id);
      if(error) notify('error', "Update Failed", "Could not save profile changes.");
      else notify('success', "Profile Updated", "Your changes have been saved successfully.");
      setIsSaving(false);
  };

  // --- PAYMENT LOGIC ---
  const handleBuyWithWallet = async (plan: typeof PLANS[0]) => {
      if (!selectedPortfolioId || !actorData?.id) return;
      
      const calc = calculateProration(plan.id);
      const duration = billingInterval === 'monthly' ? 1 : 12;

      // LOGIC A: DOWNGRADE
      if (calc.isDowngrade) {
          const sub = subscriptions[selectedPortfolioId];
          const endDate = sub ? new Date(sub.current_period_end).toLocaleDateString() : 'cycle end';
          
          openConfirmation(
              `Downgrade to ${plan.name}`,
              <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Changes will take effect at the end of your current billing cycle (<strong>{endDate}</strong>).</p>
                  <p>You will retain your current features until then. No coins will be charged today.</p>
              </div>,
              async () => {
                  setProcessingPlan(plan.id);
                  const { error } = await supabase.from('subscriptions').update({
                     cancel_at_period_end: true,
                     metadata: { ...sub?.metadata, next_plan_id: plan.id } 
                  }).eq('portfolio_id', selectedPortfolioId);
                  
                  if(error) { 
                      notify('error', "Downgrade Failed", error.message);
                  } else { 
                      notify('success', "Downgrade Scheduled", `Your plan will switch to ${plan.name} after ${endDate}`);
                      fetchData(); 
                      setIsUpgradeOpen(false); 
                  }
                  setProcessingPlan(null);
                  setConfirmDialog(null);
              },
              "Schedule Downgrade"
          );
          return;
      }

      // LOGIC B: UPGRADE
      const costToPay = calc.cost || 0;
      if (walletBalance < costToPay) {
          openConfirmation(
              "Insufficient Balance",
              <p className="text-sm text-muted-foreground">You need <strong>{costToPay} Coins</strong> but have <strong>{walletBalance}</strong>. Please top up your wallet.</p>,
              () => {
                  setIsUpgradeOpen(false);
                  setIsTopUpOpen(true);
                  setConfirmDialog(null);
              },
              "Go to Shop"
          );
          return;
      }
      
      let message = <p className="text-sm text-muted-foreground">Spend <strong>{costToPay} Coins</strong> for <strong>{duration} month(s)</strong> access?</p>;
      
      if (calc.unusedValue > 0) {
          message = (
              <div className="text-sm space-y-2 bg-muted/50 p-3 rounded-md">
                  <div className="flex justify-between"><span>New Plan Cost:</span><span>{calc.originalPrice}</span></div>
                  <div className="flex justify-between text-green-600"><span>Unused Credit:</span><span>-{calc.unusedValue}</span></div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold"><span>Pay Now:</span><span>{costToPay} Coins</span></div>
              </div>
          );
      }

      openConfirmation(
          `Confirm ${calc.isUpgrade ? 'Upgrade' : 'Purchase'}`,
          message,
          async () => {
              setConfirmDialog(null);
              setProcessingPlan(plan.id);
              const { data, error } = await supabase.rpc('purchase_subscription_with_wallet', {
                  p_actor_id: actorData.id,
                  p_portfolio_id: selectedPortfolioId, 
                  p_plan_id: plan.id,
                  p_amount: costToPay,
                  p_duration_months: duration
              });

              if(error || (data && !data.success)) { 
                  notify('error', "Transaction Failed", data?.message || error?.message || "Unknown error");
              } else { 
                  notify('success', "Plan Activated!", `You have successfully subscribed to ${plan.name}.`);
                  fetchData(); 
                  setIsUpgradeOpen(false); 
              }
              setProcessingPlan(null);
          },
          "Confirm Payment"
      );
  };

  const handleDirectStripe = async (plan: typeof PLANS[0]) => {
      if (!actorData?.id || !selectedPortfolioId) return;
      const details = plan[billingInterval]; 
      setIsRedirecting(true);
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: {
              mode: 'subscription',
              priceId: details.stripePriceId, 
              metadata: { type: 'subscription', actor_id: actorData.id, portfolio_id: selectedPortfolioId, plan_id: plan.id, interval: billingInterval },
              successUrl: window.location.origin + '/dashboard/settings?success=true',
              cancelUrl: window.location.origin + '/dashboard/settings?canceled=true'
          }
      });
      if (error || !data?.url) { notify('error', "Checkout Error", "Could not start payment session."); setIsRedirecting(false); }
      else window.location.href = data.url;
  };

  const handleManageStripeSub = async () => {
      if (!actorData?.id) return;
      setIsRedirecting(true);
      const { data, error } = await supabase.functions.invoke('create-portal-session', { body: { returnUrl: window.location.origin + '/dashboard/settings' } });
      if (error || !data?.url) { notify('error', "Portal Error", "Could not load billing portal."); setIsRedirecting(false); }
      else window.location.href = data.url;
  };

  const handleTopUpStripe = async (pack: typeof COIN_PACKS[0]) => {
      if (!actorData?.id) return;
      setIsRedirecting(true);
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: {
              mode: 'payment',
              amount: pack.cost * 100, 
              name: `${pack.coins} UCP Coins`,
              metadata: { type: 'top_up', actor_id: actorData.id, coins_amount: pack.coins },
              successUrl: window.location.origin + '/dashboard/settings?topup=success',
              cancelUrl: window.location.origin + '/dashboard/settings?topup=canceled'
          }
      });
      if (error || !data?.url) { notify('error', "Checkout Failed", "Could not start payment session."); setIsRedirecting(false); }
      else window.location.href = data.url;
  };

  // --- WHATSAPP BANK TRANSFER HANDLER ---
  const handleBankTransfer = (pack: typeof COIN_PACKS[0]) => {
      if (!actorData?.ActorName) return;
      
      // FIX: Use profile.email or cast to avoid TS error
      const userEmail = profile.email || (actorData as any).email || 'No Email';

      const message = `Hello, I would like to purchase the "${pack.name}" (${pack.coins} Coins) for $${pack.cost} via Bank Transfer.
      
My Details:
Name: ${actorData.ActorName}
Email: ${userEmail} (ID: ${actorData.id})

Please provide the bank details.`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/212695121176?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
  };

  const handleRedeemCode = async () => {
      if (!redeemCode.trim() || !actorData?.id) return;
      setIsRedeeming(true);
      const { data, error } = await supabase.rpc('redeem_gift_code', { p_actor_id: actorData.id, p_code: redeemCode.trim() });
      if(error || (data && !data.success)) { notify('error', "Redeem Failed", data?.message || error?.message); } 
      else { notify('success', "Coins Added!", "Gift code redeemed."); setRedeemCode(""); fetchData(); }
      setIsRedeeming(false);
  };

  // Helper to open delete dialog
  const openDeleteDialog = (portfolioId: string) => {
      setSelectedPortfolioId(portfolioId);
      setDeleteConfirmationName("");
      setIsDeleteOpen(true);
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-6xl mx-auto pb-24 relative">
      
      {/* --- NOTIFICATION CONTAINER --- */}
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />

      {/* Header - Stretched Balance on Mobile */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 pt-20">
        <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">Settings & Billing</h1>
            <p className="text-muted-foreground text-lg">Manage your digital presence and assets.</p>
        </div>
        
        {/* Wallet Badge (Responsive) */}
        <div className="w-full md:w-auto flex items-center justify-between gap-3 bg-gradient-to-r from-amber-100 to-orange-50 p-2 pl-4 rounded-xl border border-amber-200/50 shadow-sm transition-transform hover:scale-[1.02]">
            <div className="flex flex-col items-start mr-2">
                <span className="text-[10px] text-amber-600/80 uppercase font-bold tracking-widest leading-none mb-1">Balance</span>
                <span className="text-2xl font-black text-amber-600 leading-none">{walletBalance.toLocaleString()} <span className="text-sm font-bold text-amber-600/60">Coins</span></span>
            </div>
            <Button size="sm" onClick={() => setIsTopUpOpen(true)} className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-md border-2 border-white/20 h-10 px-5 font-bold">
                <Plus size={18} className="mr-1" /> Top Up
            </Button>
        </div>
      </div>

      <Tabs defaultValue="websites" className="space-y-8">
        {/* Scrollable Tabs List for Mobile */}
        <div className="w-full overflow-x-auto pb-2 -mb-2">
            <TabsList className="inline-flex w-auto p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="websites" className="gap-2 px-6 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"><Globe size={16}/> My Websites</TabsTrigger>
                <TabsTrigger value="history" className="gap-2 px-6 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"><CreditCard size={16}/> Billing History</TabsTrigger>
                <TabsTrigger value="account" className="gap-2 px-6 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"><User size={16}/> Account Profile</TabsTrigger>
            </TabsList>
        </div>

        {/* --- TAB 1: WEBSITES --- */}
        <TabsContent value="websites" className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            
            <div className="bg-blue-50/50 border border-blue-100 text-blue-900 p-4 rounded-xl flex items-start gap-4 shadow-sm">
                <div className="p-2.5 bg-blue-100 rounded-lg text-blue-600"><CalendarDays size={20} /></div>
                <div>
                    <h4 className="font-bold text-sm mb-1">Free Trial Policy</h4>
                    <p className="text-sm opacity-90 leading-relaxed max-w-2xl">
                        All new websites start with a <strong>14-day free trial</strong>. 
                        After 14 days, the website will become inactive unless you upgrade.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create New Card */}
                <button 
                    className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all group min-h-[280px]" 
                    onClick={() => setIsCreateOpen(true)}
                >
                    <div className="w-16 h-16 rounded-full bg-muted group-hover:bg-background flex items-center justify-center shadow-sm group-hover:shadow-md transition-all group-hover:scale-110">
                        <Plus size={32} className="text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="text-center">
                        <span className="block font-bold text-lg text-foreground mb-1">Create New Website</span>
                        <span className="text-sm text-muted-foreground">Start from a template</span>
                    </div>
                </button>

                {portfolios.map((site) => {
                    const sub = subscriptions[site.id];
                    const isPro = sub && sub.status === 'active' && new Date(sub.current_period_end) > new Date();
                    const isStripe = sub?.payment_method === 'stripe';
                    
                    let badgeColor = "bg-primary";
                    if(sub?.plan_id === 'starter') badgeColor = "bg-blue-500";
                    if(sub?.plan_id === 'agency') badgeColor = "bg-purple-600";

                    return (
                        <Card key={site.id} className="group overflow-hidden hover:shadow-lg transition-all border-muted/60 hover:border-primary/30 min-h-[280px] flex flex-col relative rounded-2xl">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-2">
                                        <Badge variant={site.is_published ? "default" : "secondary"} className="rounded-md px-2">{site.is_published ? "Live" : "Draft"}</Badge>
                                        {isPro ? (
                                            <Badge className={cn("border-0 text-white rounded-md shadow-sm", badgeColor)}>{sub.plan_id.toUpperCase()}</Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 rounded-md">Trial</Badge>
                                        )}
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground" asChild>
                                        <a href={`/pro/${site.public_slug}`} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a>
                                    </Button>
                                </div>
                                <CardTitle className="truncate text-xl font-bold leading-tight">{site.site_name || "Untitled Portfolio"}</CardTitle>
                                <CardDescription className="truncate font-medium opacity-80">{site.custom_domain || `${site.public_slug}.ucp.com`}</CardDescription>
                            </CardHeader>
                            
                            <CardContent className="py-2 flex-grow">
                                {isPro ? (
                                    <div className="text-xs text-foreground/80 bg-muted/40 p-4 rounded-xl space-y-2 border border-border/50">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Renews</span>
                                            <span className="font-semibold">{new Date(sub.current_period_end).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Method</span>
                                            <span className="uppercase font-bold text-[10px] bg-background px-1.5 py-0.5 rounded border">{sub.payment_method}</span>
                                        </div>
                                        {sub.cancel_at_period_end && (
                                            <div className="text-red-600 font-bold text-[10px] pt-1 text-center flex items-center justify-center gap-1">
                                                <Clock size={10} /> Cancels at Period End
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-sm text-amber-800 bg-amber-50 p-4 rounded-xl border border-amber-100 flex flex-col gap-1">
                                        <div className="flex items-center gap-2 font-bold text-amber-700">
                                            <AlertTriangle size={14} /> 14-Day Trial
                                        </div>
                                        <p className="opacity-80 text-xs">This site will become inactive when the trial expires.</p>
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="pt-0 grid grid-cols-[1fr_auto] gap-2 p-6">
                                {isPro && isStripe ? (
                                    <Button variant="secondary" className="w-full font-semibold" onClick={handleManageStripeSub} disabled={isRedirecting}>
                                        {isRedirecting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Manage Plan"}
                                    </Button>
                                ) : (
                                    <Button 
                                        className={cn("w-full font-bold shadow-sm transition-all", isPro ? "bg-amber-500 hover:bg-amber-600 text-white hover:scale-[1.02]" : "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-[1.02]")}
                                        onClick={() => { setSelectedPortfolioId(site.id); setIsUpgradeOpen(true); }}
                                    >
                                        {isPro ? "Extend / Manage" : "Upgrade Now"}
                                    </Button>
                                )}

                                <div className="flex gap-1">
                                    <Button size="icon" variant="outline" className="h-10 w-10 border-muted-foreground/20" asChild title="Edit Site">
                                        <a href={`/dashboard/portfolio?id=${site.id}`}><LayoutTemplate size={18} /></a>
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => openDeleteDialog(site.id)} title="Delete Site">
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </TabsContent>

        <TabsContent value="history">
            <Card>
                <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {transactions.length === 0 ? ( <div className="text-center py-8 text-muted-foreground">No transactions found.</div> ) : (
                        transactions.map(tx => (
                            <div key={tx.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-full", tx.amount > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
                                        {tx.amount > 0 ? <ArrowUpRight size={16} /> : <CreditCard size={16} />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">{tx.description}</div>
                                        <div className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className={cn("font-bold text-sm", tx.amount > 0 ? "text-green-600" : "")}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount} Coins
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="account">
             <Card>
                <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-6 max-w-xl">
                        <div className="grid gap-4">
                            <div className="space-y-2"><Label>Full Name</Label><Input value={profile.ActorName || ''} onChange={e => setProfile({...profile, ActorName: e.target.value})} /></div>
                            <div className="space-y-2"><Label>Email Address</Label><Input disabled value={profile.email || ''} className="bg-muted" /></div>
                        </div>
                        <Button onClick={handleUpdateProfile} disabled={isSaving} className="min-w-[120px]">{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Changes</Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* --- CUSTOM CONFIRMATION DIALOG --- */}
<Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
    <DialogContent className="sm:max-w-md">
        <DialogHeader>
            <DialogTitle>{confirmDialog?.title}</DialogTitle>
            {/* FIX: Use 'asChild' and wrap in a div instead of using 'component="div"' */}
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                {confirmDialog?.message}
              </div>
            </DialogDescription>
        </DialogHeader>
        <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
            <Button variant={confirmDialog?.isDestructive ? "destructive" : "default"} onClick={confirmDialog?.action}>
                {confirmDialog?.confirmText || "Confirm"}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>

      {/* --- TOP UP MODAL (GENSHIN STYLE + BANK TRANSFER) --- */}
      <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
          <DialogContent className="sm:max-w-[950px] p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-900 border-none shadow-2xl rounded-2xl max-h-[90vh]">
              <Tabs defaultValue="packs" className="w-full">
                  
                  <div className="p-4 md:p-8 space-y-6">
                      {/* HEADER + TABS TRIGGER */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                              <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                                  <Coins className="text-amber-500 fill-amber-500" /> Coin Shop
                              </DialogTitle>
                              <DialogDescription className="text-base">Top up your wallet to purchase services and upgrades.</DialogDescription>
                          </div>
                          <TabsList className="bg-muted/50 p-1 w-fit">
                              <TabsTrigger value="packs" className="px-4">Packs</TabsTrigger>
                              <TabsTrigger value="redeem" className="px-4">Redeem</TabsTrigger>
                          </TabsList>
                      </div>

                      {/* CONTENT */}
                      <TabsContent value="packs" className="mt-0">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-h-[55vh] overflow-y-auto pr-2 pb-4 custom-scrollbar">
                              {COIN_PACKS.map(pack => {
                                  // --- GENSHIN STYLE STYLING LOGIC ---
                                  let bgGradient = "from-slate-800 to-slate-900";
                                  let borderColor = "border-slate-600";
                                  let glowColor = "bg-slate-500/20";
                                  let textColor = "text-slate-100";
                                  let starColor = "text-slate-400";
                                  
                                  if (pack.rarity === 3) { // Blue
                                      bgGradient = "from-[#1e3a8a] to-[#172554]";
                                      borderColor = "border-blue-400/50";
                                      glowColor = "bg-blue-500/20";
                                      textColor = "text-blue-50";
                                      starColor = "text-blue-300";
                                  } else if (pack.rarity === 4) { // Purple
                                      bgGradient = "from-[#581c87] to-[#3b0764]";
                                      borderColor = "border-purple-400/50";
                                      glowColor = "bg-purple-500/20";
                                      textColor = "text-purple-50";
                                      starColor = "text-purple-300";
                                  } else if (pack.rarity === 5) { // Gold
                                      bgGradient = "from-[#d97706] to-[#78350f]"; // Amber to Brown
                                      borderColor = "border-amber-300";
                                      glowColor = "bg-amber-500/30";
                                      textColor = "text-amber-50";
                                      starColor = "text-yellow-300";
                                  }

                                  return (
                                      <div key={pack.id} className={cn(
                                          "relative rounded-xl border-2 overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-xl cursor-pointer group flex flex-col",
                                          borderColor,
                                          "bg-gradient-to-br", bgGradient
                                      )}>
                                          {/* Shine Effect */}
                                          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                          
                                          {/* Header: Stars */}
                                          <div className="p-3 flex justify-between items-start relative z-10">
                                              <div className="flex gap-0.5">
                                                  {[...Array(pack.rarity)].map((_, i) => (
                                                      <Star key={i} size={14} className={cn("fill-current", starColor)} />
                                                  ))}
                                              </div>
                                              {pack.bonus && (
                                                  <Badge className="bg-white/90 text-black text-[10px] font-bold shadow-sm pointer-events-none">
                                                      BONUS
                                                  </Badge>
                                              )}
                                          </div>

                                          {/* Icon Center */}
                                          <div className="flex-grow flex flex-col items-center justify-center py-4 relative">
                                              <div className={cn("absolute inset-0 blur-3xl rounded-full", glowColor)} />
                                              <div className="relative z-10 p-4 bg-black/20 rounded-full border border-white/10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                                                  <Coins size={48} className={textColor} />
                                              </div>
                                              <h3 className={cn("mt-4 font-bold text-lg tracking-wide relative z-10", textColor)}>{pack.coins} Coins</h3>
                                              {pack.bonus && <p className={cn("text-xs font-medium opacity-80 relative z-10", textColor)}>{pack.bonus}</p>}
                                          </div>

                                          {/* Footer: Price & Bank Option */}
                                          <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/10 relative z-10 space-y-2">
                                              <Button 
                                                  className="w-full bg-white text-black hover:bg-white/90 font-bold h-10 shadow-lg"
                                                  onClick={() => handleTopUpStripe(pack)} 
                                                  disabled={isRedirecting}
                                              >
                                                  {isRedirecting ? <Loader2 className="w-4 h-4 animate-spin"/> : `Pay $${pack.cost.toFixed(2)}`}
                                              </Button>
                                              
                                              {/* Bank Transfer for Packs >= 550 Coins */}
                                              {pack.coins >= 550 && (
                                                  <Button 
                                                      variant="ghost" 
                                                      className={cn("w-full h-8 text-xs hover:bg-white/10", textColor)}
                                                      onClick={() => handleBankTransfer(pack)}
                                                  >
                                                      <MessageCircle size={14} className="mr-2" /> Bank Transfer (WhatsApp)
                                                  </Button>
                                              )}
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </TabsContent>

                      <TabsContent value="redeem" className="space-y-4">
                          <div className="bg-muted/30 p-8 rounded-xl border border-dashed border-muted-foreground/20 flex flex-col items-center text-center gap-4 max-w-md mx-auto">
                              <div className="p-4 bg-primary/10 text-primary rounded-full"><Gift size={40} /></div>
                              <div className="space-y-1">
                                  <h4 className="font-bold text-xl">Redeem Gift Code</h4>
                                  <p className="text-muted-foreground">Enter your unique code to claim rewards.</p>
                              </div>
                              <div className="flex w-full items-center gap-2 mt-2">
                                  <Input className="text-center font-mono uppercase tracking-widest h-11" placeholder="XXXX-XXXX-XXXX" value={redeemCode} onChange={e => setRedeemCode(e.target.value)} />
                              </div>
                              <Button onClick={handleRedeemCode} disabled={isRedeeming} className="w-full h-11 font-bold">{isRedeeming ? <Loader2 className="w-4 h-4 animate-spin"/> : "Redeem Code"}</Button>
                          </div>
                      </TabsContent>
                  </div>
              </Tabs>
          </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5"/> Delete Website</DialogTitle>
                  <DialogDescription>
                      This action cannot be undone. This will permanently delete your website and remove your data from our servers.
                  </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-4 text-sm text-destructive-foreground">
                      <p className="font-bold">Warning:</p>
                      The website <strong>{portfolios.find(p => p.id === selectedPortfolioId)?.site_name}</strong> will be lost forever.
                  </div>
                  <Label className="mb-2 block">To confirm, type the website name below:</Label>
                  <Input 
                      value={deleteConfirmationName} 
                      onChange={e => setDeleteConfirmationName(e.target.value)} 
                      placeholder={portfolios.find(p => p.id === selectedPortfolioId)?.site_name}
                      className="border-destructive/30 focus-visible:ring-destructive"
                  />
              </div>

              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDeleteSite} disabled={isDeleting}>
                      {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete Website
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* --- UPGRADE MODAL --- */}
      <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Manage Plan</DialogTitle>
                  <DialogDescription>Upgrade to unlock more features.</DialogDescription>
              </DialogHeader>

              {/* Billing Toggle */}
              <div className="flex justify-center mb-6 mt-2">
                  <div className="bg-muted p-1.5 rounded-xl flex gap-1 border">
                      <button onClick={() => setBillingInterval('monthly')} className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all", billingInterval === 'monthly' ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>Monthly</button>
                      <button onClick={() => setBillingInterval('yearly')} className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2", billingInterval === 'yearly' ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>Yearly <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full shadow-sm">SAVE 15%</span></button>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4">
                  {PLANS.map(plan => {
                      const details = plan[billingInterval];
                      const proration = calculateProration(plan.id);
                      const isCurrent = subscriptions[selectedPortfolioId || '']?.plan_id === plan.id;

                      return (
                          <Card key={plan.id} className={cn("relative transition-all border-2 flex flex-col overflow-hidden", isCurrent ? "border-primary bg-primary/5 shadow-md scale-[1.02]" : "hover:border-primary/50 hover:shadow-sm", processingPlan === plan.id ? "opacity-50" : "")}>
                              {plan.popular && <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] px-3 py-1 font-bold rounded-bl-xl shadow-sm">POPULAR</div>}
                              
                              <CardHeader className="pb-4">
                                  <CardTitle className="text-xl font-bold flex justify-between items-center">
                                      {plan.name}
                                      {isCurrent && <Badge className="bg-primary/20 text-primary hover:bg-primary/20 pointer-events-none">Current</Badge>}
                                  </CardTitle>
                                  <div className="flex items-baseline gap-1 mt-2">
                                      <span className="text-3xl font-black">${details.stripeCost.toFixed(2)}</span>
                                      <span className="text-sm text-muted-foreground font-medium">/{billingInterval === 'monthly' ? 'mo' : 'yr'}</span>
                                  </div>
                              </CardHeader>
                              
                              <CardContent className="flex-grow space-y-6">
                                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-center">
                                      <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-1">Pay with Coins</div>
                                      
                                      {/* DYNAMIC PRICING DISPLAY */}
                                      {proration.isUpgrade && proration.unusedValue > 0 ? (
                                           <div className="flex flex-col items-center">
                                                <span className="text-xs text-muted-foreground line-through decoration-amber-500/50 mb-0.5">{details.coinCost} Coins</span>
                                                <div className="flex items-center justify-center gap-1.5 text-amber-900 font-black text-xl">
                                                    <Coins size={20} className="fill-amber-500 text-amber-600" /> {proration.cost}
                                                </div>
                                                <span className="text-[10px] font-medium text-amber-700/80 bg-white/50 px-2 py-0.5 rounded-full mt-1">Prorated Price</span>
                                           </div>
                                      ) : (
                                          <div className="flex items-center justify-center gap-1.5 text-amber-900 font-black text-xl">
                                              <Coins size={20} className="fill-amber-500 text-amber-600" /> {details.coinCost}
                                          </div>
                                      )}
                                  </div>

                                  <ul className="space-y-3">
                                      {plan.features.map(f => (
                                          <li key={f} className="flex items-center gap-3 text-sm font-medium text-muted-foreground"><div className="p-0.5 rounded-full bg-green-100 text-green-600"><Check size={12} strokeWidth={3}/></div> {f}</li>
                                      ))}
                                  </ul>
                              </CardContent>

                              <CardFooter className="flex flex-col gap-3 pt-2">
                                  {isCurrent ? (
                                      <Button className="w-full bg-muted text-muted-foreground cursor-not-allowed font-bold" disabled>Active Plan</Button>
                                  ) : proration.isDowngrade ? (
                                      <Button 
                                          className="w-full border-dashed border-2 bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground font-semibold" 
                                          onClick={() => handleBuyWithWallet(plan)}
                                          disabled={!!processingPlan}
                                      >
                                          {processingPlan === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                          <Clock size={16} className="mr-2" /> Downgrade Later
                                      </Button>
                                  ) : (
                                      <>
                                        <Button 
                                            className="w-full bg-amber-500 hover:bg-amber-600 text-white border-0 font-bold shadow-sm hover:shadow-md transition-all" 
                                            onClick={() => handleBuyWithWallet(plan)}
                                            disabled={!!processingPlan}
                                        >
                                            {processingPlan === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles size={16} className="mr-2 fill-white/20" />}
                                            {proration.unusedValue > 0 ? `Pay ${proration.cost} Coins` : `Upgrade with Coins`}
                                        </Button>

                                        <Button 
                                            variant="ghost" 
                                            className="w-full text-xs h-9 text-muted-foreground hover:text-foreground"
                                            onClick={() => handleDirectStripe(plan)}
                                            disabled={isRedirecting}
                                        >
                                            {isRedirecting ? <Loader2 className="mr-2 h-3 w-3 animate-spin"/> : `Or Pay $${details.stripeCost.toFixed(2)} via Card`}
                                        </Button>
                                      </>
                                  )}
                              </CardFooter>
                          </Card>
                      );
                  })}
              </div>
          </DialogContent>
      </Dialog>
      
      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create New Website</DialogTitle><DialogDescription>Choose a starting template.</DialogDescription></DialogHeader>
              <div className="space-y-6 py-4">
                  <div className="space-y-2"><Label>Website Name</Label><Input placeholder="e.g. My Site" value={newSiteName} onChange={(e) => setNewSiteName(e.target.value)} /></div>
                  <div className="space-y-3"><Label>Select Template</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {PORTFOLIO_TEMPLATES.map((template) => (
                              <div key={template.id} onClick={() => setSelectedTemplate(template.id)} className={cn("cursor-pointer border-2 rounded-xl p-4 transition-all hover:border-primary/50 relative", selectedTemplate === template.id ? "border-primary bg-primary/5" : "border-muted bg-muted/20")}>
                                  {selectedTemplate === template.id && (<div className="absolute top-3 right-3 text-primary"><Check size={16} /></div>)}
                                  <h4 className="font-bold text-sm">{template.name}</h4><p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateSite} disabled={isCreating}>{isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Website</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;