import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ActorDashboardContextType } from '../../layouts/ActorDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Globe, User, Plus, ExternalLink, Settings, LayoutTemplate, Check, Wallet, CreditCard, Landmark, ArrowUpRight, Coins } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { PORTFOLIO_TEMPLATES } from '../../lib/templates';
import { cn } from "@/lib/utils";

// --- CONFIGURATION ---

// 1. PLANS (Direct Stripe Subscriptions)
// YOU MUST REPLACE 'price_...' WITH YOUR REAL STRIPE PRICE IDs FROM YOUR DASHBOARD
const PLANS = [
    { 
        id: 'pro_monthly', 
        stripePriceId: 'price_1Q...', // <--- PUT YOUR STRIPE PRICE ID HERE
        name: 'Pro Monthly', 
        cost: 20, 
        duration: 1, 
        label: 'Billed Monthly' 
    },
    { 
        id: 'pro_yearly', 
        stripePriceId: 'price_1Q...', // <--- PUT YOUR STRIPE PRICE ID HERE
        name: 'Pro Yearly', 
        cost: 200, 
        duration: 12, 
        label: 'Billed Yearly (Save $40)' 
    },
];

// 2. COIN PACKS (Wallet Top-Up)
const COIN_PACKS = [
    { id: 'starter', name: 'Starter Pack', coins: 20, cost: 20, popular: false },
    { id: 'creator', name: 'Creator Pack', coins: 55, cost: 50, popular: true, bonus: '+5 Free' }, // Incentivized
    { id: 'agency', name: 'Agency Pack', coins: 120, cost: 100, popular: false, bonus: '+20 Free' },
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
  
  // New: Loading state for Stripe redirect
  const [isRedirecting, setIsRedirecting] = useState(false); 

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

  // --- 1. WALLET PURCHASE (Use Balance) ---
  const handleBuyWithWallet = async (planId: string, cost: number, months: number) => {
      if (!selectedPortfolioId || !actorData?.id) return;

      if (walletBalance < cost) {
          if(confirm("Insufficient funds. Go to Top Up page?")) {
              setIsUpgradeOpen(false);
              setIsTopUpOpen(true);
          }
          return;
      }
      
      if(!confirm(`Pay $${cost} from wallet for this site?`)) return;

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

  // --- 2. DIRECT STRIPE CHECKOUT (Subscription) ---
  const handleDirectStripe = async (plan: typeof PLANS[0]) => {
      if (!actorData?.id || !selectedPortfolioId) return;
      setIsRedirecting(true);

      // Call our new Edge Function
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: {
              mode: 'subscription',
              priceId: plan.stripePriceId, // Use the real ID
              metadata: {
                  type: 'subscription',
                  actor_id: actorData.id,
                  portfolio_id: selectedPortfolioId,
                  plan_id: plan.id
              },
              successUrl: window.location.origin + '/dashboard/settings?success=true',
              cancelUrl: window.location.origin + '/dashboard/settings?canceled=true'
          }
      });

      if (error) {
          console.error(error);
          alert("Failed to start checkout");
          setIsRedirecting(false);
      } else if (data?.url) {
          window.location.href = data.url; // Go to Stripe
      }
  };

  // --- 3. TOP UP CHECKOUT (One-Time Payment) ---
  const handleTopUpStripe = async (pack: typeof COIN_PACKS[0]) => {
      if (!actorData?.id) return;
      setIsRedirecting(true);

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: {
              mode: 'payment', // One-time
              amount: pack.cost * 100, // Cents!
              name: `${pack.coins} UCP Coins`,
              metadata: {
                  type: 'top_up',
                  actor_id: actorData.id,
                  coins_amount: pack.coins
              },
              successUrl: window.location.origin + '/dashboard/settings?topup=success',
              cancelUrl: window.location.origin + '/dashboard/settings?topup=canceled'
          }
      });

      if (error) {
          console.error(error);
          alert("Failed to start checkout");
          setIsRedirecting(false);
      } else if (data?.url) {
          window.location.href = data.url; // Go to Stripe
      }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-6 w-full max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pt-20">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings & Billing</h1>
            <p className="text-muted-foreground">Manage your websites and subscription plans.</p>
        </div>
        <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-lg border">
            <div className="flex flex-col items-end px-2">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Wallet Balance</span>
                <span className="text-lg font-bold text-primary">${walletBalance.toFixed(2)}</span>
            </div>
            <Button size="sm" onClick={() => setIsTopUpOpen(true)} className="gap-2">
                <Plus size={16} /> Top Up
            </Button>
        </div>
      </div>

      <Tabs defaultValue="websites" className="space-y-6">
        <TabsList>
            <TabsTrigger value="websites" className="gap-2"><Globe size={16}/> My Websites</TabsTrigger>
            <TabsTrigger value="history" className="gap-2"><Wallet size={16}/> Billing History</TabsTrigger>
            <TabsTrigger value="account" className="gap-2"><User size={16}/> Account Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="websites" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/10 rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all group h-[240px]" onClick={() => setIsCreateOpen(true)}>
                    <div className="p-3 bg-muted rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors"><Plus size={24} /></div>
                    <span className="font-medium text-muted-foreground group-hover:text-foreground">Create New Website</span>
                </button>

                {portfolios.map((site) => {
                    const sub = subscriptions[site.id];
                    const isPro = sub && sub.status === 'active' && new Date(sub.current_period_end) > new Date();

                    return (
                        <Card key={site.id} className="overflow-hidden hover:shadow-md transition-all h-[240px] flex flex-col relative group">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-2">
                                        <Badge variant={site.is_published ? "default" : "secondary"}>{site.is_published ? "Live" : "Draft"}</Badge>
                                        {isPro ? (
                                            <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 border-0 text-white">Pro</Badge>
                                        ) : (
                                            <Badge variant="outline">Free</Badge>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-6 w-6" asChild>
                                            <a href={`/pro/${site.public_slug}`} target="_blank" rel="noreferrer"><ExternalLink size={12} /></a>
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="truncate">{site.site_name || "Untitled Portfolio"}</CardTitle>
                                <CardDescription className="truncate">{site.custom_domain || `${site.public_slug}.example.com`}</CardDescription>
                            </CardHeader>
                            <CardContent className="py-2 flex-grow">
                                {isPro ? (
                                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                        Plan renews: {new Date(sub.current_period_end).toLocaleDateString()}
                                    </div>
                                ) : (
                                    <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded flex items-center justify-between">
                                        <span>Basic features active.</span>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="pt-0 grid grid-cols-2 gap-2">
                                <Button size="sm" variant="outline" asChild>
                                    <a href={`/dashboard/portfolio?id=${site.id}`}><LayoutTemplate size={14} className="mr-2"/> Edit</a>
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant={isPro ? "secondary" : "default"} 
                                    className={isPro ? "" : "bg-primary text-primary-foreground"}
                                    onClick={() => { setSelectedPortfolioId(site.id); setIsUpgradeOpen(true); }}
                                >
                                    {isPro ? "Manage Plan" : "Upgrade"}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </TabsContent>

        <TabsContent value="history">
            <Card>
                <CardHeader>
                    <CardTitle>Wallet Transactions</CardTitle>
                    <CardDescription>History of deposits and plan purchases.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {transactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No transactions found.</div>
                    ) : (
                        transactions.map(tx => (
                            <div key={tx.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-full", tx.amount > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                                        {tx.amount > 0 ? <ArrowUpRight size={16} /> : <Check size={16} />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">{tx.description}</div>
                                        <div className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className={cn("font-bold text-sm", tx.amount > 0 ? "text-green-500" : "")}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="account">
            <Card>
                <CardHeader>
                    <CardTitle>Personal Info</CardTitle>
                    <CardDescription>Your global account details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Name</Label><Input value={profile.ActorName || ''} onChange={e => setProfile({...profile, ActorName: e.target.value})} /></div>
                            <div className="space-y-2"><Label>Email</Label><Input disabled value={profile.email || ''} /></div>
                        </div>
                        <div className="space-y-2"><Label>Global Bio</Label><Input value={profile.bio || ''} onChange={e => setProfile({...profile, bio: e.target.value})} /></div>
                        <div className="pt-2"><Button onClick={handleUpdateProfile} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Profile</Button></div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* --- MODAL 1: TOP UP BALANCE --- */}
      <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
          <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                  <DialogTitle>Top Up Wallet</DialogTitle>
                  <DialogDescription>Buy UCP Coins to use for site subscriptions.</DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="packs" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="packs">Coin Packs</TabsTrigger>
                      <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
                  </TabsList>

                  <TabsContent value="packs" className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {COIN_PACKS.map(pack => (
                              <div key={pack.id} className={cn("border-2 rounded-xl p-4 flex flex-col items-center text-center cursor-pointer transition-all hover:border-primary", pack.popular ? "border-primary bg-primary/5" : "bg-muted/20")}>
                                  {pack.popular && <span className="text-[10px] font-bold uppercase text-primary mb-1">Most Popular</span>}
                                  <div className="p-3 bg-muted rounded-full mb-2"><Coins size={24} className="text-amber-500" /></div>
                                  <div className="font-bold text-lg">{pack.name}</div>
                                  <div className="text-2xl font-bold mt-1">${pack.cost}</div>
                                  {pack.bonus && <div className="text-xs text-green-600 font-medium mt-1">{pack.bonus}</div>}
                                  <Button className="w-full mt-4 h-8 text-xs" onClick={() => handleTopUpStripe(pack)} disabled={isRedirecting}>
                                      {isRedirecting ? <Loader2 className="w-3 h-3 animate-spin"/> : "Buy Now"}
                                  </Button>
                              </div>
                          ))}
                      </div>
                      <p className="text-[11px] text-center text-muted-foreground">Payments processed securely by Stripe.</p>
                  </TabsContent>

                  <TabsContent value="bank" className="space-y-4 text-sm">
                      <div className="bg-amber-500/10 text-amber-600 p-3 rounded-lg border border-amber-500/20 mb-4">
                          <strong>Note:</strong> Bank transfers take 24-48 hours to appear in your wallet.
                      </div>
                      <div className="space-y-2 border p-4 rounded-lg bg-muted/20">
                          <div className="grid grid-cols-3 gap-2">
                              <span className="text-muted-foreground">Bank Name:</span> <span className="col-span-2 font-medium">UCP Global Bank</span>
                              <span className="text-muted-foreground">Account:</span> <span className="col-span-2 font-medium">1234-5678-9012</span>
                              <span className="text-muted-foreground">Ref Code:</span> 
                              <span className="col-span-2 font-mono bg-white px-2 py-0.5 rounded border w-fit">{actorData.id?.slice(0, 8).toUpperCase() || '...'}</span>
                          </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground text-center">Include the Ref Code in your transfer description so we can credit your wallet.</p>
                  </TabsContent>
              </Tabs>
          </DialogContent>
      </Dialog>

      {/* --- MODAL 2: UPGRADE SITE --- */}
      <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
          <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                  <DialogTitle>Upgrade Website Plan</DialogTitle>
                  <DialogDescription>
                      Choose a plan for this specific portfolio.
                  </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  {PLANS.map(plan => (
                      <Card key={plan.id} className={cn("relative cursor-pointer transition-all border-2 hover:border-primary", processingPlan === plan.id ? "opacity-50" : "")}>
                          <CardHeader>
                              <CardTitle>{plan.name}</CardTitle>
                              <CardDescription>{plan.label}</CardDescription>
                          </CardHeader>
                          <CardContent>
                              <div className="text-3xl font-bold">${plan.cost}</div>
                              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                                  <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> All Pro Features</li>
                                  <li className="flex items-center gap-2"><Check size={14} className="text-green-500"/> Custom Domain</li>
                              </ul>
                          </CardContent>
                          <CardFooter className="flex flex-col gap-2">
                              <Button 
                                  className="w-full" 
                                  onClick={() => handleBuyWithWallet(plan.id, plan.cost, plan.duration)}
                                  disabled={!!processingPlan}
                              >
                                  {processingPlan === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Pay with Wallet Balance
                              </Button>
                              <Button 
                                  variant="outline" 
                                  className="w-full"
                                  onClick={() => handleDirectStripe(plan)}
                                  disabled={isRedirecting}
                              >
                                  {isRedirecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Subscribe via Stripe"}
                              </Button>
                          </CardFooter>
                      </Card>
                  ))}
              </div>
          </DialogContent>
      </Dialog>

      {/* --- MODAL 3: CREATE SITE (Existing) --- */}
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