import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useOutletContext, useNavigate } from "react-router-dom";
import { ActorDashboardContextType } from "../../layouts/ActorDashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Globe,
  Store,
  Lock,
  CreditCard,
  Zap,
  Landmark,
  Bitcoin,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NotificationContainer,
  Notification,
} from "@/components/ui/NotificationToast";
import { useSubscription } from "../../context/SubscriptionContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "recharts";

const PaymentsPage = () => {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const { plan: currentPlanId, isLoading: isSubLoading } = useSubscription();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>({});
  const [portfolios, setPortfolios] = useState<any[]>([]);

  // 'global' means Account-Level. Otherwise, it holds the specific portfolio ID.
  const [selectedContext, setSelectedContext] = useState<string>("global");

  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Check if they are on the Pro plan (assuming 'pro' is the ID for the top tier)
  const isPro = currentPlanId === "pro";

  const notify = (
    type: "success" | "error" | "info",
    title: string,
    message?: string
  ) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications((prev) => [...prev, { id, type, title, message }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const fetchData = async () => {
    if (!actorData?.id) return;
    setLoading(true);

    const { data: actor } = await supabase
      .from("actors")
      .select("*")
      .eq("id", actorData.id)
      .single();
    if (actor) setProfile(actor);

    const { data: sites } = await supabase
      .from("portfolios")
      .select("*")
      .eq("actor_id", actorData.id)
      .order("created_at", { ascending: false });
    if (sites) setPortfolios(sites);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [actorData.id]);

  // --- STRIPE EXPRESS LOGIC (MANAGED PAYMENTS) ---
  const handleConnectExpress = async () => {
    if (!actorData?.id) return;
    setIsConnectingStripe(true);
    try {
      const isOverride = selectedContext !== "global";
      const { data, error } = await supabase.functions.invoke(
        "stripe-connect",
        {
          body: {
            actorId: actorData.id,
            portfolioId: isOverride ? selectedContext : null,
            returnUrl: window.location.origin + "/dashboard/payments",
          },
        }
      );
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      notify("error", "Stripe Error", err.message);
      setIsConnectingStripe(false);
    }
  };
  // --- STRIPE STANDARD LOGIC (BRING YOUR OWN) ---
  const handleConnectStandard = () => {
    if (!isPro) {
      navigate("/dashboard/settings?tab=billing");
      return;
    }

    if (!actorData?.id) return;

    // 1. Get your Client ID from your .env file
    const clientId = import.meta.env.VITE_STRIPE_CLIENT_ID;

    // 2. We use the 'state' parameter to pass the actor ID and site context
    // so we know exactly who is connecting when Stripe sends them back.
    const isOverride = selectedContext !== "global";
    const portfolioId = isOverride ? selectedContext : "global";
    const stateString = btoa(
      JSON.stringify({ actorId: actorData.id, portfolioId })
    ); // Base64 encode it

    // 3. Construct the secure Stripe OAuth URL
    const stripeOAuthUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&state=${stateString}`;

    // 4. Send them to Stripe!
    window.location.href = stripeOAuthUrl;
  };
  if (loading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );

  // Determine which Stripe ID we are currently looking at
  const activePortfolio = portfolios.find((p) => p.id === selectedContext);
  const currentStripeId =
    selectedContext === "global"
      ? profile.stripe_account_id
      : activePortfolio?.stripe_account_id;
  const isInheriting =
    selectedContext !== "global" &&
    !activePortfolio?.stripe_account_id &&
    profile.stripe_account_id;

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      {/* --- HEADER --- */}
      <div className="px-4 pt-6 pb-6 md:pt-12 md:pb-8 md:px-8 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 pt-20">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground">
              Payments & Integrations
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Route your money perfectly.
            </p>
          </div>
        </div>

        {/* --- CONTEXT SWITCHER --- */}
        <div className="bg-card p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 block">
              Configuring Settings For
            </Label>
            <Select value={selectedContext} onValueChange={setSelectedContext}>
              <SelectTrigger className="w-full sm:w-[300px] h-11 border-2 font-semibold">
                <SelectValue placeholder="Select context" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-indigo-500" /> Global
                    Account (Default)
                  </div>
                </SelectItem>
                {portfolios.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    <div className="flex items-center gap-2">
                      <Store size={16} className="text-slate-500" />{" "}
                      {site.site_name || "Untitled Site"}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground sm:max-w-xs sm:text-right">
            {selectedContext === "global" ? (
              "These defaults apply to all your websites automatically unless overridden."
            ) : isInheriting ? (
              <span className="flex items-center sm:justify-end gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                <AlertCircle size={16} /> Currently inheriting Global Settings
              </span>
            ) : (
              <span className="flex items-center sm:justify-end gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                <Zap size={16} /> Using Custom Site Override
              </span>
            )}
          </div>
        </div>

        {/* --- INTEGRATION GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-8">
          {/* 1. STRIPE EXPRESS (MANAGED) */}
          <Card
            className={cn(
              "flex flex-col border-2 overflow-hidden transition-all",
              currentStripeId
                ? "border-green-500/30 bg-green-50/10"
                : "border-border"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-1">
                <div className="h-10 w-10 bg-[#635BFF]/10 rounded-xl flex items-center justify-center">
                  <Zap size={20} className="text-[#635BFF] fill-[#635BFF]/20" />
                </div>
                {currentStripeId && (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    Active
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">Managed Payouts</CardTitle>
              <CardDescription>
                The easiest way to get paid. Connect your bank and we handle the
                tax forms, compliance, and fraud.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow pb-4">
              <div className="flex items-center gap-2 text-sm font-semibold bg-muted/50 w-fit px-3 py-1.5 rounded-lg border">
                <span className="text-muted-foreground line-through">
                  2.9% + 30¢
                </span>
                <span className="text-foreground">5% Platform Fee</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              {currentStripeId ? (
                <div className="w-full flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-700 dark:text-green-400">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <CheckCircle2 size={16} /> ID: {currentStripeId}
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-green-700"
                    onClick={handleConnectExpress}
                  >
                    Dashboard
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full font-bold bg-[#635BFF] hover:bg-[#635BFF]/90 text-white"
                  onClick={handleConnectExpress}
                  disabled={isConnectingStripe}
                >
                  {isConnectingStripe ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Connect Bank Account
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* 2. STRIPE STANDARD (BYO) - PADLOCKED UPSELL */}
          <Card
            className={cn(
              "flex flex-col border-2 overflow-hidden transition-all relative",
              !isPro ? "bg-muted/30 border-dashed" : "border-border"
            )}
          >
            {!isPro && (
              <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-10 flex items-start justify-end p-5 pointer-events-none">
                <div className="bg-background border shadow-sm rounded-full p-2 text-muted-foreground">
                  <Lock size={18} />
                </div>
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-1">
                <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                  <CreditCard
                    size={20}
                    className="text-slate-700 dark:text-slate-300"
                  />
                </div>
                {isPro && <Badge variant="secondary">Pro Only</Badge>}
              </div>
              <CardTitle className="text-xl">Bring Your Own Stripe</CardTitle>
              <CardDescription>
                Connect your existing standard Stripe account. You keep 100% of
                your sales and manage your own tax compliance.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow pb-4">
              <div className="flex items-center gap-2 text-sm font-semibold bg-muted/50 w-fit px-3 py-1.5 rounded-lg border">
                <span className="text-foreground">0% Platform Fee</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0 relative z-20">
              {!isPro ? (
                <Button
                  variant="outline"
                  className="w-full font-bold border-indigo-500/30 text-indigo-600 hover:bg-indigo-50"
                  onClick={handleConnectStandard}
                >
                  Upgrade to Pro to Unlock
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full font-bold"
                  onClick={handleConnectStandard}
                >
                  Connect Standard Account
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* 3. MANUAL BANK TRANSFER (PLACEHOLDER) */}
          <Card className="flex flex-col border-2 border-border/50 opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
            <CardHeader className="pb-3">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-1">
                <Landmark
                  size={20}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
              <CardTitle className="text-lg">Manual Bank Transfer</CardTitle>
              <CardDescription>
                Display your local bank or Wise details to fans. Manage order
                fulfillment manually.
              </CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Badge
                variant="secondary"
                className="w-full justify-center rounded-lg py-1.5"
              >
                Coming Soon
              </Badge>
            </CardFooter>
          </Card>

          {/* 4. CRYPTO / USDC (PLACEHOLDER) */}
          <Card className="flex flex-col border-2 border-border/50 opacity-60 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
            <CardHeader className="pb-3">
              <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-1">
                <Bitcoin
                  size={20}
                  className="text-amber-600 dark:text-amber-400"
                />
              </div>
              <CardTitle className="text-lg">Crypto (USDC)</CardTitle>
              <CardDescription>
                Receive stablecoins directly to your Web3 wallet. Zero
                chargeback risk globally.
              </CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Badge
                variant="secondary"
                className="w-full justify-center rounded-lg py-1.5"
              >
                Coming Soon
              </Badge>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
