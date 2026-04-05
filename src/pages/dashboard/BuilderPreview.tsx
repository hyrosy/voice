// src/pages/dashboard/BuilderPreview.tsx
import React, { useState, useEffect, Suspense } from "react";
import { PortfolioSection } from "../../types/portfolio";
import {
  THEME_REGISTRY,
  DEFAULT_THEME,
  resolveThemeComponent,
} from "../../themes/registry";
import { cn, hexToHSL } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function BuilderPreview() {
  const [sections, setSections] = useState<PortfolioSection[]>([]);
  const [themeConfig, setThemeConfig] = useState<any>({});

  // 1. Establish the postMessage Bridge
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // In production, you'd verify event.origin here for security
      if (event.data?.type === "UPDATE_PREVIEW") {
        setSections(event.data.payload.sections);
        setThemeConfig(event.data.payload.themeConfig);
      }
    };

    window.addEventListener("message", handleMessage);

    // Tell the parent window we are ready to receive data
    window.parent.postMessage({ type: "PREVIEW_READY" }, "*");

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // 2. Setup Theme Variables
  const themeId = themeConfig.templateId || "modern";
  const ActiveTheme = THEME_REGISTRY[themeId] || DEFAULT_THEME;
  const fontClass =
    themeConfig.font === "serif"
      ? "font-serif"
      : themeConfig.font === "mono"
      ? "font-mono"
      : "font-sans";

  // Basic colors fallback
  const primaryColor =
    themeConfig.primaryColor === "blue" ? "#3b82f6" : "#8b5cf6"; // Expand this logic based on your palettes
  const primaryHSL = hexToHSL(primaryColor);
  const radiusVal = themeConfig.radius !== undefined ? themeConfig.radius : 0.5;

  const previewStyle = {
    "--primary": primaryHSL,
    "--ring": primaryHSL,
    "--radius": `${radiusVal * 2}rem`,
  } as React.CSSProperties;

  // 3. Render the exact same way the live site does
  return (
    <div
      className={cn("min-h-screen bg-background text-foreground", fontClass)}
      data-theme={themeConfig.templateId}
      data-btn-style={themeConfig.buttonStyle || "solid"}
      style={previewStyle}
    >
      {sections
        .filter((s) => s.isVisible)
        .map((section) => {
          const Component = resolveThemeComponent(ActiveTheme, section.type);

          if (!Component) return null;

          const sectionProps = {
            data: section.data,
            settings: section.settings || {},
            id: section.id,
            allSections: sections,
            isPreview: true,
            actorId: "preview-mode",
            portfolioId: "preview-mode",
          };

          const zIndexClass =
            section.type === "header" ? "relative z-50" : "relative z-0";

          return (
            <div
              id={section.id}
              key={section.id}
              className={cn(
                zIndexClass,
                // Subtle hover ring so they know what section they are looking at
                "group relative hover:ring-2 hover:ring-primary/40 hover:ring-inset transition-all duration-200"
              )}
              // ONLY catch clicks on links/buttons so the user doesn't accidentally navigate away
              onClickCapture={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest("a") || target.tagName === "BUTTON") {
                  e.preventDefault();
                }
              }}
            >
              {/* 🚀 THE FIX: Dedicated Settings Tab (Framer Style) */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[100]">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Prevent this click from doing anything else
                    window.parent.postMessage(
                      { type: "EDIT_SECTION", payload: section.id },
                      "*"
                    );
                  }}
                  className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded shadow-lg flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                >
                  {/* Assuming you have Settings or Edit2 imported from lucide-react */}
                  Edit {section.type.replace("_", " ")}
                </button>
              </div>

              <Suspense
                fallback={
                  <div className="py-12 flex justify-center">
                    <Loader2 className="animate-spin text-muted-foreground" />
                  </div>
                }
              >
                {/* Removed pointer-events-none so users can click text to inline-edit! */}
                <Component {...sectionProps} />
              </Suspense>
            </div>
          );
        })}
    </div>
  );
}
