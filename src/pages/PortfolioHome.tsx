// src/pages/PortfolioHome.tsx

import React from "react";
import { useOutletContext } from "react-router-dom";
import { PortfolioSection } from "../types/portfolio";
import { cn, hexToHSL } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import {
  THEME_REGISTRY,
  DEFAULT_THEME,
  resolveThemeComponent,
} from "../themes/registry";

// 🚀 1. EXPORT COLOR_PALETTES AND THEME_WRAPPER
// We export these so your new PortfolioLayout can import and use them!
export const COLOR_PALETTES = [
  { id: "violet", value: "#8b5cf6" },
  { id: "blue", value: "#3b82f6" },
  { id: "emerald", value: "#10b981" },
  { id: "rose", value: "#f43f5e" },
  { id: "amber", value: "#f59e0b" },
  { id: "slate", value: "#64748b" },
  { id: "black", value: "#000000" },
];

export const ThemeWrapper = ({
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

  // 🚀 MAGIC THEME CHECK: If it's Modern or Cinematic, force AAA+ Dark Mode globally!
  const isDarkTheme =
    !theme?.templateId ||
    theme?.templateId === "modern" ||
    theme?.templateId === "cinematic";

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col w-full subpixel-antialiased",
        isDarkTheme
          ? "bg-neutral-950 text-white"
          : "bg-background text-foreground",
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

interface PortfolioHomeProps {
  editorData?: any;
  isPreview?: boolean;
}

const PortfolioHome: React.FC<PortfolioHomeProps> = ({
  editorData,
  isPreview = false,
}) => {
  // 🚀 2. SMART DATA FETCHING
  // If in builder mode, use editorData. If live site, grab from PortfolioLayout!
  let outletContext: any = null;
  try {
    outletContext = useOutletContext();
  } catch (e) {
    // Ignore error if rendered outside of a router (like in the builder iframe)
  }

  const portfolio = isPreview
    ? editorData
    : outletContext?.portfolio || editorData;

  if (!portfolio) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  const sections = portfolio.sections as PortfolioSection[];
  const themeId = portfolio.theme_config?.templateId || "modern";
  const ActiveTheme = THEME_REGISTRY[themeId] || DEFAULT_THEME;

  // 🚀 3. RENDER THE SECTIONS
  const content = (
    <>
      {sections
        .filter((section) => {
          if (!section.isVisible) return false;

          // 🚀 THE MAGIC SWITCH:
          // On the LIVE site, PortfolioLayout renders the header and footer. So hide them here!
          // In the BUILDER preview, we MUST render them so the user can edit them.
          if (
            !isPreview &&
            section.type === "header" //|| section.type === "footer"
          ) {
            return false;
          }
          return true;
        })
        .map((section) => {
          const Component = resolveThemeComponent(ActiveTheme, section.type);

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
            return null;
          }

          const zIndexClass =
            section.type === "header" ? "relative z-50" : "relative z-0";

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
    </>
  );

  // 🚀 4. BUILDER FALLBACK
  // If we are in the builder, PortfolioLayout isn't wrapping us, so we must apply the ThemeWrapper here!
  if (isPreview) {
    return (
      <ThemeWrapper theme={portfolio.theme_config}>{content}</ThemeWrapper>
    );
  }

  // On the live site, PortfolioLayout already applied the ThemeWrapper and Helmet, so just return the raw content!
  return content;
};

export default PortfolioHome;
