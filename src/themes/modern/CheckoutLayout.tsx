import React from "react";
import { Outlet, Link, useOutletContext } from "react-router-dom";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";

const CheckoutLayout = () => {
  // Grab the portfolio context passed down from the root PublicPortfolioLayout
  const { portfolio } = useOutletContext<{ portfolio: any }>();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      {/* THEME DEV AREA: CUSTOM CHECKOUT HEADER 
        Often in e-commerce, the main navigation is hidden during checkout to reduce 
        distractions. This adds a dedicated, minimal checkout header.
      */}
      <div className="w-full max-w-6xl mx-auto px-4 py-6 md:px-8 flex justify-between items-center border-b border-border/40">
        <Link
          to={`/pro/${portfolio.public_slug}/shop`}
          className="flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Shop
        </Link>

        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
          <Lock size={14} className="text-primary" /> Secure Checkout
        </div>
      </div>

      {/* THEME DEV AREA: MAIN CONTENT WRAPPER 
        This is where the theme developer controls the padding, max-width, 
        and background patterns of the checkout area.
      */}
      <main className="flex-grow w-full h-full relative z-10 pb-20">
        {/* The Stripe logic from PublicCheckoutPage.tsx is injected right here */}
        <Outlet context={{ portfolio }} />
      </main>

      {/* THEME DEV AREA: TRUST FOOTER 
        A minimal footer to reinforce security before they put their card in.
      */}
      <footer className="py-8 border-t border-border/40 bg-card text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck size={18} className="text-primary" />
          <span className="font-medium">
            Payments processed securely by Stripe
          </span>
        </div>
        <p>All transactions are secure and encrypted.</p>
      </footer>
    </div>
  );
};

export default CheckoutLayout;
