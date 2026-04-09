import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Coins, Star, MessageCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const COIN_PACKS = [
  {
    id: "handful",
    name: "Handful of Coins",
    coins: 250,
    cost: 5,
    bonus: "",
    rarity: 3,
  },
  {
    id: "bag",
    name: "Bag of Coins",
    coins: 550,
    cost: 10,
    bonus: "+50 Free!",
    popular: true,
    rarity: 4,
  },
  {
    id: "chest",
    name: "Chest of Coins",
    coins: 1200,
    cost: 20,
    bonus: "+200 Free!",
    rarity: 5,
  },
  {
    id: "handful_lg",
    name: "Sack of Coins",
    coins: 1500,
    cost: 26,
    bonus: "+200 Free!",
    rarity: 4,
  },
  {
    id: "bag_lg",
    name: "Treasury",
    coins: 3000,
    cost: 54,
    bonus: "+300 Free!",
    popular: true,
    rarity: 5,
  },
  {
    id: "chest_lg",
    name: "Vault of Coins",
    coins: 8000,
    cost: 153,
    bonus: "+350 Free!",
    rarity: 5,
  },
];

interface TopUpModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  actorData: any;
  profile: any;
  onSuccess: () => void;
  notify: (
    type: "success" | "error" | "info",
    title: string,
    msg?: string
  ) => void;
}

export default function TopUpModal({
  isOpen,
  onOpenChange,
  actorData,
  profile,
  onSuccess,
  notify,
}: TopUpModalProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleTopUpStripe = async (pack: (typeof COIN_PACKS)[0]) => {
    if (!actorData?.id) return;
    setIsRedirecting(true);
    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session",
      {
        body: {
          mode: "payment",
          amount: pack.cost * 100,
          name: `${pack.coins} UCP Coins`,
          metadata: {
            type: "top_up",
            actor_id: actorData.id,
            coins_amount: pack.coins,
          },
          successUrl:
            window.location.origin +
            "/dashboard/settings?tab=billing&topup=success",
          cancelUrl:
            window.location.origin +
            "/dashboard/settings?tab=billing&topup=canceled",
        },
      }
    );
    if (error || !data?.url) {
      notify("error", "Checkout Failed", "Could not start payment session.");
      setIsRedirecting(false);
    } else {
      window.location.href = data.url;
    }
  };

  const handleBankTransfer = (pack: (typeof COIN_PACKS)[0]) => {
    if (!actorData?.ActorName) return;
    const userEmail = profile?.email || actorData.email || "No Email";
    const message = `Hello, I would like to purchase the "${pack.name}" (${pack.coins} Coins) for $${pack.cost} via Bank Transfer.\n\nMy Details:\nName: ${actorData.ActorName}\nEmail: ${userEmail} (ID: ${actorData.id})\n\nPlease provide the bank details.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/212695121176?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleRedeemCode = async () => {
    if (!redeemCode.trim() || !actorData?.id) return;
    setIsRedeeming(true);
    const { data, error } = await supabase.rpc("redeem_gift_code", {
      p_actor_id: actorData.id,
      p_code: redeemCode.trim(),
    });
    if (error || (data && !data.success)) {
      notify("error", "Redeem Failed", data?.message || error?.message);
    } else {
      notify("success", "Coins Added!", "Gift code redeemed.");
      setRedeemCode("");
      onSuccess();
    }
    setIsRedeeming(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-[100dvh] sm:h-[85vh] sm:max-w-[950px] p-0 gap-0 bg-zinc-50 dark:bg-zinc-900 border-none shadow-2xl sm:rounded-2xl flex flex-col">
        <Tabs defaultValue="packs" className="w-full h-full flex flex-col">
          <div className="p-4 md:p-8 shrink-0 bg-background sm:bg-transparent border-b sm:border-0 z-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <DialogTitle className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
                    <Coins className="text-amber-500 fill-amber-500" /> Coin
                    Shop
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    Top up to purchase upgrades.
                  </DialogDescription>
                </div>
              </div>
              <TabsList className="bg-muted/50 p-1 w-full md:w-fit grid grid-cols-2 md:flex">
                <TabsTrigger value="packs">Packs</TabsTrigger>
                <TabsTrigger value="redeem">Redeem</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent
            value="packs"
            className="mt-0 flex-grow overflow-y-auto px-4 py-4 md:px-8 md:pb-8 custom-scrollbar bg-zinc-50/50 dark:bg-zinc-900/50"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-12 sm:pb-0">
              {COIN_PACKS.map((pack) => {
                let bgGradient = "from-slate-800 to-slate-900";
                let borderColor = "border-slate-600";
                let glowColor = "bg-slate-500/20";
                let textColor = "text-slate-100";
                let starColor = "text-slate-400";

                if (pack.rarity === 3) {
                  bgGradient = "from-[#1e3a8a] to-[#172554]";
                  borderColor = "border-blue-400/50";
                  glowColor = "bg-blue-500/20";
                  textColor = "text-blue-50";
                  starColor = "text-blue-300";
                } else if (pack.rarity === 4) {
                  bgGradient = "from-[#581c87] to-[#3b0764]";
                  borderColor = "border-purple-400/50";
                  glowColor = "bg-purple-500/20";
                  textColor = "text-purple-50";
                  starColor = "text-purple-300";
                } else if (pack.rarity === 5) {
                  bgGradient = "from-[#d97706] to-[#78350f]";
                  borderColor = "border-amber-300";
                  glowColor = "bg-amber-500/30";
                  textColor = "text-amber-50";
                  starColor = "text-yellow-300";
                }

                return (
                  <div
                    key={pack.id}
                    className={cn(
                      "relative rounded-xl border-2 overflow-hidden transition-all duration-200 active:scale-[0.98] sm:hover:scale-[1.02] cursor-pointer flex flex-col shadow-lg",
                      borderColor,
                      "bg-gradient-to-br",
                      bgGradient
                    )}
                  >
                    <div className="p-3 flex justify-between relative z-10">
                      <div className="flex gap-0.5">
                        {[...Array(pack.rarity)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={cn("fill-current", starColor)}
                          />
                        ))}
                      </div>
                      {pack.bonus && (
                        <Badge className="bg-white/90 text-black text-[9px] font-bold h-5">
                          BONUS
                        </Badge>
                      )}
                    </div>
                    <div className="flex-grow flex flex-col items-center justify-center py-2 relative">
                      <div
                        className={cn(
                          "absolute inset-0 blur-3xl rounded-full opacity-60",
                          glowColor
                        )}
                      />
                      <Coins
                        size={40}
                        className={cn(
                          "relative z-10 drop-shadow-lg",
                          textColor
                        )}
                      />
                      <h3
                        className={cn(
                          "mt-2 font-black text-xl tracking-wide relative z-10",
                          textColor
                        )}
                      >
                        {pack.coins}
                      </h3>
                    </div>
                    <div className="p-3 bg-black/40 backdrop-blur-md border-t border-white/10 relative z-10">
                      <Button
                        className="w-full bg-white text-black hover:bg-white/90 font-bold h-10 shadow-lg"
                        onClick={() => handleTopUpStripe(pack)}
                        disabled={isRedirecting}
                      >
                        {isRedirecting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          `$${pack.cost.toFixed(2)}`
                        )}
                      </Button>
                      {pack.coins >= 550 && (
                        <div
                          onClick={() => handleBankTransfer(pack)}
                          className={cn(
                            "mt-2 text-center text-[10px] opacity-70 flex items-center justify-center gap-1 py-1 cursor-pointer active:opacity-100",
                            textColor
                          )}
                        >
                          <MessageCircle size={10} /> Bank Transfer
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent
            value="redeem"
            className="mt-0 flex-grow overflow-y-auto px-4 pb-8"
          >
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col gap-4 mt-4">
              <Input
                className="text-center font-mono uppercase text-lg h-12"
                placeholder="CODE"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
              />
              <Button
                onClick={handleRedeemCode}
                disabled={isRedeeming}
                className="w-full h-12 font-bold text-lg"
              >
                {isRedeeming ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Redeem"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="sm:hidden p-4 bg-background border-t">
          <Button
            variant="outline"
            className="w-full h-12 text-base"
            onClick={() => onOpenChange(false)}
          >
            Close Shop
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
