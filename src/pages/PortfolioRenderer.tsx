// src/pages/PortfolioRenderer.tsx

import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { PortfolioSection } from "../types/portfolio";
import { cn, hexToHSL } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import {
  THEME_REGISTRY,
  DEFAULT_THEME,
  resolveThemeComponent,
} from "../themes/registry"; // <--- Import resolver
import SEO from "../components/common/SEO";
import { trackEvent } from "../lib/analytics";
import { usePortfolio } from "../hooks/usePortfolio";

const COLOR_PALETTES = [
  { id: "violet", value: "#8b5cf6" },
  { id: "blue", value: "#3b82f6" },
  { id: "emerald", value: "#10b981" },
  { id: "rose", value: "#f43f5e" },
  { id: "amber", value: "#f59e0b" },
  { id: "slate", value: "#64748b" },
  { id: "black", value: "#000000" },
];

const ThemeWrapper = ({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: any;
}) => {
  const fontClass =
    theme?.font === "serif"
      ? "font-serif"
      : theme?.font === "mono"
      ? "font-mono"
      : "font-sans";
  const activeColorObj =
    COLOR_PALETTES.find((c) => c.id === theme?.primaryColor) ||
    COLOR_PALETTES[0];
  const primaryHSL = hexToHSL(activeColorObj.value);
  const radiusVal = theme?.radius !== undefined ? theme.radius : 0.5;

  const style = {
    "--primary": primaryHSL,
    "--ring": primaryHSL,
    "--radius": `${radiusVal * 2}rem`,
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground subpixel-antialiased",
        fontClass
      )}
      data-theme={theme?.templateId}
      data-btn-style={theme?.buttonStyle || "solid"}
      style={style}
    >
      {children}
    </div>
  );
};

interface PortfolioRendererProps {
  editorData?: any;
  isPreview?: boolean;
  customDomain?: string;
}

const PortfolioRenderer: React.FC<PortfolioRendererProps> = ({
  editorData,
  isPreview = false,
  customDomain,
}) => {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, isError } = usePortfolio({
    slug,
    customDomain,
    enabled: !editorData,
  });

  const portfolio = editorData || data?.portfolio;
  const actorProfile = data?.actorProfile;

  // --- ANALYTICS TRACKING ---
  useEffect(() => {
    if (portfolio && !isPreview && portfolio.actor_id) {
      const sessionKey = `viewed_${portfolio.id}_${new Date().toDateString()}`;
      if (!sessionStorage.getItem(sessionKey)) {
        trackEvent(portfolio.actor_id, "page_view", {
          portfolio_id: portfolio.id,
        });
        sessionStorage.setItem(sessionKey, "true");
      }
    }
  }, [portfolio, isPreview]);

  // --- LOADING / ERROR STATES ---
  if (isLoading && !editorData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if ((isError || !portfolio) && !editorData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl font-bold mb-2">Portfolio Not Found</h1>
        <p className="text-muted-foreground">
          This page does not exist or has not been published yet.
        </p>
      </div>
    );
  }

  // --- RENDER SETUP ---
  const sections = portfolio.sections as PortfolioSection[];
  const themeId = portfolio.theme_config?.templateId || "modern";
  const ActiveTheme = THEME_REGISTRY[themeId] || DEFAULT_THEME;

  const seoTitle = isPreview
    ? "Preview Portfolio"
    : portfolio.site_name || actorProfile?.ActorName || "Portfolio";
  const seoDesc = isPreview
    ? "Live preview of your portfolio."
    : actorProfile?.bio ||
      `Check out the professional portfolio of ${seoTitle}.`;
  const seoImage = isPreview ? "" : actorProfile?.HeadshotURL || "";

  return (
    <>
      {!isPreview && (
        <SEO
          title={seoTitle}
          description={seoDesc}
          image={seoImage}
          type="profile"
        />
      )}

      <ThemeWrapper theme={portfolio.theme_config}>
        {sections
          .filter((s) => s.isVisible)
          .map((section) => {
            // 1. Safe Component Lookup via Registry
            const Component = resolveThemeComponent(ActiveTheme, section.type);

            // 2. Graceful Fallback for missing components
            if (!Component) {
              if (isPreview) {
                return (
                  <div
                    key={section.id}
                    className="p-4 text-center text-red-500 font-mono text-sm bg-red-50"
                  >
                    Missing Component: {section.type}
                  </div>
                );
              }
              return null; // On the LIVE site, silently hide broken sections to protect the actor's brand
            }

            const zIndexClass =
              section.type === "header" ? "relative z-50" : "relative z-0";

            // 3. Unified Props Object (No more if/else statements!)
            const sectionProps = {
              data: section.data,
              settings: section.settings || {},
              id: section.id,
              allSections: sections,
              isPreview: isPreview,
              actorId: portfolio.actor_id,
              portfolioId: portfolio.id,
            };

            return (
              <div
                id={section.id}
                key={section.id}
                className={cn("scroll-mt-20", zIndexClass)}
              >
                {/* 4. React Suspense Wrapper for future Lazy Loading */}
                <React.Suspense
                  fallback={
                    <div className="py-24 flex justify-center">
                      <Loader2 className="animate-spin text-muted-foreground" />
                    </div>
                  }
                >
                  <Component {...sectionProps} />
                </React.Suspense>
              </div>
            );
          })}
      </ThemeWrapper>
    </>
  );
};

export default PortfolioRenderer;
