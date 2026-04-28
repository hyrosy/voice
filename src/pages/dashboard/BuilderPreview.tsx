// src/pages/dashboard/BuilderPreview.tsx
import React, { useState, useEffect, Suspense } from "react";
import { PortfolioSection } from "../../types/portfolio";
import {
  THEME_REGISTRY,
  DEFAULT_THEME,
  resolveThemeComponent,
} from "../../themes/registry";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// --- Helper to convert HEX to HSL for Tailwind ---
function hexToHSLString(hex: string): string {
  hex = hex.replace(/^#/, "");
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(
    l * 100
  )}%`;
}

export default function BuilderPreview() {
  const [sections, setSections] = useState<PortfolioSection[]>([]);
  const [themeConfig, setThemeConfig] = useState<any>({});

  // 1. Establish the postMessage Bridge
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
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

  const primaryHsl = themeConfig.primaryColor
    ? hexToHSLString(themeConfig.primaryColor)
    : "259 94% 51%";
  const activeFont = themeConfig.font || "Inter";
  const fontUrl = `https://fonts.googleapis.com/css2?family=${activeFont.replace(
    / /g,
    "+"
  )}:wght@300;400;500;600;700;800;900&display=swap`;
  const activeRadius =
    themeConfig.radius !== undefined ? themeConfig.radius : 0.5;

  return (
    <>
      <style>
        {`
          @import url('${fontUrl}');
          
          :root {
            --primary: ${primaryHsl};
            --radius: ${activeRadius}rem;
          }

          /* 🚀 FIX: Smooth internal scrollbar injected directly into the iframe */
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(156, 163, 175, 0.3);
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(156, 163, 175, 0.5);
          }

          /* 🚀 FIX: Apply background globally to html/body to remove white flashes */
          html, body {
            margin: 0;
            padding: 0;
            background-color: ${
              themeId === "cinematic" ? "#0f172a" : "var(--background)"
            };
            color: ${themeId === "cinematic" ? "#f8fafc" : "var(--foreground)"};
          }

          .builder-preview-wrapper {
            font-family: '${activeFont}', sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          
          .builder-preview-wrapper button, 
          .builder-preview-wrapper input, 
          .builder-preview-wrapper textarea,
          .builder-preview-wrapper select {
            font-family: inherit;
          }
        `}
      </style>

      {/* 3. Render the preview wrapper */}
      <div
        className={cn(
          "builder-preview-wrapper selection:bg-primary/30 selection:text-primary",
          themeId === "cinematic" ? "dark" : ""
        )}
        data-btn-style={themeConfig.buttonStyle || "solid"}
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
                  "group relative hover:ring-2 hover:ring-primary/40 hover:ring-inset transition-all duration-200"
                )}
                onClickCapture={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest("a") || target.tagName === "BUTTON") {
                    e.preventDefault();
                  }
                }}
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[100]">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.parent.postMessage(
                        { type: "EDIT_SECTION", payload: section.id },
                        "*"
                      );
                    }}
                    className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded shadow-lg flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                  >
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
                  <Component {...sectionProps} />
                </Suspense>
              </div>
            );
          })}
      </div>
    </>
  );
}
