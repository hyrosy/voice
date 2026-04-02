// src/themes/cinematic/index.ts

import { lazy } from "react";
import { PortfolioThemeDefinition } from "../types";
import { ModernTheme } from "../modern"; // Inherits the lazy-loaded Modern base

// 🚀 AAA+ LAZY LOADING: Dynamic imports for the Cinematic overrides
const Header = lazy(() => import("./Header"));
const ImageSlider = lazy(() => import("./ImageSlider"));
const VideoSlider = lazy(() => import("./VideoSlider"));
// (Note: We don't need to import LeadForm here anymore, because spreading
// ModernTheme below automatically brings in the lazy-loaded Modern LeadForm!)

// --- 3. Create the Theme Definition ---
export const CinematicTheme: PortfolioThemeDefinition = {
  ...ModernTheme, // 1. Fallback to Modern for everything else (Fixes the Shop typo!)

  // 2. Overwrite with your specific Cinematic components
  Header,
  ImageSlider,
  VideoSlider,
};
