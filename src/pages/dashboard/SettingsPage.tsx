import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ActorDashboardContextType } from '../../layouts/ActorDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Globe, User, Plus, ExternalLink, LayoutTemplate, Check, CreditCard, ArrowUpRight, Coins, Gift, Sparkles } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { PORTFOLIO_TEMPLATES } from '../../lib/templates';
import { cn } from "@/lib/utils";

// --- CONFIGURATION ---

// 1. NEW PRICING TIERS
const PLANS = [
    { 
        id: 'starter', 
        stripePriceId: 'price_STARTER_MONTHLY', // REPLACE ME
        name: 'Starter', 
        stripeCost: 2.50, 
        coinCost: 75, 
        duration: 1, 
        features: ['1 Website', 'Standard Support', 'UCP Branding']
    },
    { 
        id: 'pro', 
        stripePriceId: 'price_PRO_MONTHLY', // REPLACE ME
        name: 'Pro', 
        stripeCost: 5.00, 
        coinCost: 150, 
        duration: 1, 
        popular: true,
        features: ['3 Websites', 'Custom Domain', 'No Branding', 'SEO Tools']
    },
    { 
        id: 'agency', 
        stripePriceId: 'price_AGENCY_MONTHLY', // REPLACE ME
        name: 'Agency', 
        stripeCost: 15.00, 
        coinCost: 450, 
        duration: 1, 
        features: ['Unlimited Sites', 'Priority Support', 'White Label', 'API Access']
    },
];

// 2. COIN PACKS (Rate: $1 = 50 Coins)
const COIN_PACKS = [
    { id: 'handful', name: 'Handful of Coins', coins: 250, cost: 5, bonus: '' },
    { id: 'bag', name: 'Bag of Coins', coins: 550, cost: 10, bonus: '+50 Free!', popular: true },
    { id: 'chest', name: 'Chest of Coins', coins: 1200, cost: 20, bonus: '+200 Free!' },
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
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>(PORTFOLIO_TEMPLATES[0].id);
  const [newSiteName, setNewSiteName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false); 
  
  // New Redeem State
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

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

  // --- ACTIONS ---

  const handleUpdateProfile = async () => {
      if (!actorData?.id) return;
      setIsSaving(true);
      const { error } = await supabase.from('actors').update({ ActorName: profile.ActorName, bio: profile.bio }).eq('id', actorData.id);
      if(error) alert("Error saving profile");
      else alert("Profile updated!");
      setIsSaving(false);
  }

  const handleCreateSite = async () => {
      if (!newSiteName.trim()) { alert("Please enter a site name"); return; }
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

      if (error) alert("Failed to create site.");
      else { setIsCreateOpen(false); setNewSiteName(""); fetchData(); }
      setIsCreating(false);
  };

  const handleBuyWithWallet = async (planId: string, cost: number, months: number) => {
      if (!selectedPortfolioId || !actorData?.id) return;
      if (walletBalance < cost) {
          if(confirm(`Not enough Coins! You need ${cost} but have ${walletBalance}.\nGo to Top Up?`)) {
              setIsUpgradeOpen(false);
              setIsTopUpOpen(true);
          }
          return;
      }
      
      if(!confirm(`Spend ${cost} Coins to upgrade?`)) return;

      setProcessingPlan(planId);
      const { data, error } = await supabase.rpc('purchase_subscription_with_wallet', {
          p_actor_id: actorData.id,
          p_portfolio_id: selectedPortfolioId, 
          p_plan_id: planId,
          p_cost: cost,
          p_duration_months: months
      });

      if(error || (data && !data.success)) {
          alert("Transaction Failed: " + (data?.message || error?.message));
      } else {
          alert("Success! Site upgraded.");
          fetchData(); 
          setIsUpgradeOpen(false);
      }
      setProcessingPlan(null);
  };

  const handleDirectStripe = async (plan: typeof PLANS[0]) => {
      if (!actorData?.id || !selectedPortfolioId) return;
      setIsRedirecting(true);
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: {
              mode: 'subscription',
              priceId: plan.stripePriceId, 
              metadata: { type: 'subscription', actor_id: actorData.id, portfolio_id: selectedPortfolioId, plan_id: plan.id },
              successUrl: window.location.origin + '/dashboard/settings?success=true',
              cancelUrl: window.location.origin + '/dashboard/settings?canceled=true'
          }
      });
      if (error || !data?.url) { alert("Failed to start checkout"); setIsRedirecting(false); }
      else window.location.href = data.url;
  };

  // --- STRIPE CUSTOMER PORTAL (Manage existing sub) ---
  const handleManageStripeSub = async () => {
      if (!actorData?.id) return;
      setIsRedirecting(true);
      // We assume you have a function 'create-portal-session'
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
          body: {
              // You might need to store stripe_customer_id in your actors table for this to work perfectly
              // For now, we pass the return URL
              returnUrl: window.location.origin + '/dashboard/settings',
          }
      });
      if (error || !data?.url) { 
          alert("Could not load billing portal. (Ensure Customer ID is saved)"); 
          setIsRedirecting(false); 
      }
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
      if (error || !data?.url) { alert("Failed to start checkout"); setIsRedirecting(false); }
      else window.location.href = data.url;
  };

  const handleRedeemCode = async () => {
      if (!redeemCode.trim() || !actorData?.id) return;
      setIsRedeeming(true);
      
      const { data, error } = await supabase.rpc('redeem_gift_code', {
          p_actor_id: actorData.id,
          p_code: redeemCode.trim()
      });

      if(error || (data && !data.success)) {
          alert("Redeem Failed: " + (data?.message || error?.message));
      } else {
          alert("Success! Coins added.");
          setRedeemCode("");
          fetchData();
      }
      setIsRedeeming(false);
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-6 w-full max-w-5xl mx-auto">
      {/* Header with Wallet Badge */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pt-20">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings & Billing</h1>
            <p className="text-muted-foreground">Manage your websites and subscription plans.</p>
        </div>
        <div className="flex items-center gap-4 bg-gradient-to-r from-amber-100 to-amber-50 p-2 rounded-xl border border-amber-200 shadow-sm">
            <div className="flex flex-col items-end px-2">
                <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider flex items-center gap-1">
                     <Coins size={10} /> Wallet Balance
                </span>
                <span className="text-xl font-bold text-amber-700">{walletBalance} Coins</span>
            </div>
            <Button size="sm" onClick={() => setIsTopUpOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white gap-2 shadow-sm">
                <Plus size={16} /> Top Up
            </Button>
        </div>
      </div>

      <Tabs defaultValue="websites" className="space-y-6">
        <TabsList>
            <TabsTrigger value="websites" className="gap-2"><Globe size={16}/> My Websites</TabsTrigger>
            <TabsTrigger value="history" className="gap-2"><CreditCard size={16}/> Billing History</TabsTrigger>
            <TabsTrigger value="account" className="gap-2"><User size={16}/> Account Profile</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: WEBSITES --- */}
        <TabsContent value="websites" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/10 rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all group h-[260px]" onClick={() => setIsCreateOpen(true)}>
                    <div className="p-3 bg-muted rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors"><Plus size={24} /></div>
                    <span className="font-medium text-muted-foreground group-hover:text-foreground">Create New Website</span>
                </button>

                {portfolios.map((site) => {
                    const sub = subscriptions[site.id];
                    const isPro = sub && sub.status === 'active' && new Date(sub.current_period_end) > new Date();
                    const isStripe = sub?.payment_method === 'stripe';
                    
                    // Determine Badge Color based on Plan
                    let badgeColor = "bg-primary";
                    if(sub?.plan_id === 'starter') badgeColor = "bg-blue-500";
                    if(sub?.plan_id === 'agency') badgeColor = "bg-purple-600";

                    return (
                        <Card key={site.id} className="overflow-hidden hover:shadow-md transition-all h-[260px] flex flex-col relative group">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-2">
                                        <Badge variant={site.is_published ? "default" : "secondary"}>{site.is_published ? "Live" : "Draft"}</Badge>
                                        {isPro ? (
                                            <Badge className={cn("border-0 text-white", badgeColor)}>{sub.plan_id.toUpperCase()}</Badge>
                                        ) : (
                                            <Badge variant="outline">Trial</Badge>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-6 w-6" asChild>
                                            <a href={`/pro/${site.public_slug}`} target="_blank" rel="noreferrer"><ExternalLink size={12} /></a>
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="truncate">{site.site_name || "Untitled Portfolio"}</CardTitle>
                                <CardDescription className="truncate">{site.custom_domain || `${site.public_slug}.ucp.com`}</CardDescription>
                            </CardHeader>
                            <CardContent className="py-2 flex-grow">
                                {isPro ? (
                                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded space-y-1">
                                        <div className="flex justify-between">
                                            <span>Renews:</span>
                                            <span className="font-medium">{new Date(sub.current_period_end).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Method:</span>
                                            <span className="uppercase text-[10px]">{sub.payment_method}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded flex items-center justify-between">
                                        <span>Trial Mode Active</span>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="pt-0 grid grid-cols-2 gap-2">
                                <Button size="sm" variant="outline" asChild>
                                    <a href={`/dashboard/portfolio?id=${site.id}`}><LayoutTemplate size={14} className="mr-2"/> Edit</a>
                                </Button>
                                {isPro && isStripe ? (
                                    <Button size="sm" variant="secondary" onClick={handleManageStripeSub} disabled={isRedirecting}>
                                        {isRedirecting ? <Loader2 className="w-3 h-3 animate-spin"/> : "Manage Plan"}
                                    </Button>
                                ) : (
                                    <Button 
                                        size="sm" 
                                        className={isPro ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-primary text-primary-foreground"}
                                        onClick={() => { setSelectedPortfolioId(site.id); setIsUpgradeOpen(true); }}
                                    >
                                        {isPro ? "Manage Plan" : "Upgrade"}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </TabsContent>

        <TabsContent value="history">
            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                </CardHeader>
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
                <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Name</Label><Input value={profile.ActorName || ''} onChange={e => setProfile({...profile, ActorName: e.target.value})} /></div>
                            <div className="space-y-2"><Label>Email</Label><Input disabled value={profile.email || ''} /></div>
                        </div>
                        <div className="pt-2"><Button onClick={handleUpdateProfile} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Profile</Button></div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* --- MODAL 1: TOP UP (With Redeem) --- */}
      <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
          <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Coins className="text-amber-500"/> Top Up Wallet</DialogTitle>
                  <DialogDescription>Buy coins or redeem a gift code.</DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="packs" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="packs">Buy Coins</TabsTrigger>
                      <TabsTrigger value="redeem">Redeem Code</TabsTrigger>
                  </TabsList>

                  <TabsContent value="packs" className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {COIN_PACKS.map(pack => (
                              <div key={pack.id} className={cn("border-2 rounded-xl p-4 flex flex-col items-center text-center cursor-pointer transition-all hover:border-amber-400 bg-white relative", pack.popular ? "border-amber-400 ring-1 ring-amber-400/20" : "border-muted")}>
                                  {pack.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Best Value</span>}
                                  <div className="p-3 bg-amber-50 rounded-full mb-2"><Coins size={24} className="text-amber-500" /></div>
                                  <div className="font-bold text-lg">{pack.coins} Coins</div>
                                  <div className="text-xl font-bold mt-1">${pack.cost}</div>
                                  {pack.bonus && <div className="text-xs text-green-600 font-bold mt-1 bg-green-50 px-2 py-0.5 rounded">{pack.bonus}</div>}
                                  <Button className="w-full mt-4 h-8 text-xs bg-slate-900" onClick={() => handleTopUpStripe(pack)} disabled={isRedirecting}>
                                      {isRedirecting ? <Loader2 className="w-3 h-3 animate-spin"/> : "Buy"}
                                  </Button>
                              </div>
                          ))}
                      </div>
                  </TabsContent>

                  <TabsContent value="redeem" className="space-y-4">
                      <div className="bg-muted/30 p-6 rounded-xl border flex flex-col items-center text-center gap-3">
                          <Gift size={32} className="text-primary/50" />
                          <div className="space-y-1">
                              <h4 className="font-medium">Have a Gift Code?</h4>
                              <p className="text-sm text-muted-foreground">Enter your code below to instantly add coins.</p>
                          </div>
                          <div className="flex w-full max-w-sm items-center space-x-2 mt-2">
                              <Input type="text" placeholder="UCP-XXXX-XXXX" value={redeemCode} onChange={e => setRedeemCode(e.target.value)} />
                              <Button onClick={handleRedeemCode} disabled={isRedeeming}>{isRedeeming ? <Loader2 className="w-4 h-4 animate-spin"/> : "Redeem"}</Button>
                          </div>
                      </div>
                  </TabsContent>
              </Tabs>
          </DialogContent>
      </Dialog>

      {/* --- MODAL 2: UPGRADE SITE (Dual Pricing) --- */}
      <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
          <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                  <DialogTitle>Upgrade Plan</DialogTitle>
                  <DialogDescription>Save big by paying with UCP Coins.</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                  {PLANS.map(plan => (
                      <Card key={plan.id} className={cn("relative transition-all border-2 flex flex-col hover:border-primary", processingPlan === plan.id ? "opacity-50" : "")}>
                          {plan.popular && <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] px-2 py-1 font-bold rounded-bl">POPULAR</div>}
                          <CardHeader className="pb-3">
                              <CardTitle className="text-lg">{plan.name}</CardTitle>
                              <div className="flex items-baseline gap-1 mt-1">
                                  <span className="text-2xl font-bold">${plan.stripeCost}</span>
                                  <span className="text-xs text-muted-foreground">/mo</span>
                              </div>
                          </CardHeader>
                          <CardContent className="flex-grow">
                              <div className="bg-amber-50 border border-amber-100 p-2 rounded mb-4 text-center">
                                  <div className="text-xs text-amber-700 font-medium uppercase tracking-wider mb-1">Wallet Price</div>
                                  <div className="flex items-center justify-center gap-1 text-amber-900 font-bold text-lg">
                                      <Coins size={16} /> {plan.coinCost} <span className="text-xs font-normal">Coins</span>
                                  </div>
                              </div>
                              <ul className="space-y-2 text-xs text-muted-foreground">
                                  {plan.features.map(f => (
                                      <li key={f} className="flex items-center gap-2"><Check size={12} className="text-green-500"/> {f}</li>
                                  ))}
                              </ul>
                          </CardContent>
                          <CardFooter className="flex flex-col gap-2 pt-0">
                              <Button 
                                  className="w-full bg-amber-500 hover:bg-amber-600 text-white border-0" 
                                  onClick={() => handleBuyWithWallet(plan.id, plan.coinCost, plan.duration)}
                                  disabled={!!processingPlan}
                              >
                                  {processingPlan === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Pay {plan.coinCost} Coins
                              </Button>
                              <Button 
                                  variant="ghost" 
                                  className="w-full text-xs h-8"
                                  onClick={() => handleDirectStripe(plan)}
                                  disabled={isRedirecting}
                              >
                                  {isRedirecting ? <Loader2 className="mr-2 h-3 w-3 animate-spin"/> : `Or Pay $${plan.stripeCost} via Card`}
                              </Button>
                          </CardFooter>
                      </Card>
                  ))}
              </div>
          </DialogContent>
      </Dialog>
      
      {/* Existing Create Modal code omitted for brevity but should remain */}
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