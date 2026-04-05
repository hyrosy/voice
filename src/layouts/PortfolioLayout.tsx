import React, { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";

import { usePortfolio } from "../hooks/usePortfolio";
import { trackEvent } from "../lib/analytics";
import {
  THEME_REGISTRY,
  DEFAULT_THEME,
  resolveThemeComponent,
} from "../themes/registry";

// 🚀 1. Import the ThemeWrapper we exported from PortfolioHome
import { ThemeWrapper } from "../pages/PortfolioHome";

// 🚀 2. Import your Smart Cart Container
import CartDrawerContainer from "@/components/CartDrawerContainer";
// 🚀 1. ADD THIS INTERFACE
interface PortfolioLayoutProps {
  customDomain?: string;
}
export default function PortfolioLayout({
  customDomain,
}: PortfolioLayoutProps) {
  const { slug } = useParams<{ slug: string }>();
  // --- 1. GLOBAL DATA FETCH ---
  // We fetch this ONCE for the entire site. React Query caches it instantly.
  const { data, isLoading, isError } = usePortfolio({ slug, customDomain });
  // --- ANALYTICS TRACKING ---
  useEffect(() => {
    if (data?.portfolio && data.portfolio.actor_id) {
      const sessionKey = `viewed_${
        data.portfolio.id
      }_${new Date().toDateString()}`;
      if (!sessionStorage.getItem(sessionKey)) {
        trackEvent(data.portfolio.actor_id, "page_view", {
          portfolio_id: data.portfolio.id,
        });
        sessionStorage.setItem(sessionKey, "true");
      }
    }
  }, [data]);

  // --- LOADING & ERROR STATES ---
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-neutral-950">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  if (isError || !data?.portfolio) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center text-center p-4 bg-neutral-950 text-white">
        <h1 className="text-3xl font-bold mb-2">Portfolio Not Found</h1>
        <p className="text-neutral-400">
          This page does not exist or has not been published yet.
        </p>
      </div>
    );
  }

  const { portfolio, actorProfile } = data;
  const sections = portfolio.sections || [];

  // --- THEME & COMPONENT RESOLUTION ---
  const themeId = portfolio.theme_config?.templateId || "modern";
  const ActiveTheme = THEME_REGISTRY[themeId] || DEFAULT_THEME;

  // Find the global header section
  const headerSection = sections.find((s: any) => s.type === "header");

  // Dynamically resolve the Header component based on the active theme
  const HeaderComponent = headerSection
    ? resolveThemeComponent(ActiveTheme, "header")
    : null;

  const seoTitle =
    portfolio.site_name || actorProfile?.ActorName || "Portfolio";

  return (
    <>
      {/* 🚀 2. CLIENT-SIDE SEO */}
      <Helmet>
        <title>{seoTitle}</title>
      </Helmet>

      {/* 🚀 3. THEME WRAPPER (Applies Dark Mode, Primary Colors, and Fonts globally) */}
      <ThemeWrapper theme={portfolio.theme_config}>
        {/* 🚀 4. THE GLOBAL HEADER */}
        {HeaderComponent && headerSection?.isVisible && (
          <div className="relative z-50">
            <HeaderComponent
              data={headerSection.data}
              allSections={sections}
              id={headerSection.id}
              actorId={portfolio.actor_id}
              portfolioId={portfolio.id}
              isPreview={false} // Always false here, this is the live site!
            />
          </div>
        )}

        {/* 🚀 5. THE MAGIC OUTLET */}
        {/* React Router will inject PortfolioHome, Shop, or DynamicPage right here */}
        <main className="min-h-screen relative z-0">
          <Outlet context={{ portfolio, actorProfile }} />
        </main>

        {/* 🚀 6. THE GLOBAL CART */}
        <CartDrawerContainer
          theme={themeId}
          username={slug}
          isPreview={false}
        />
      </ThemeWrapper>
    </>
  );
}
