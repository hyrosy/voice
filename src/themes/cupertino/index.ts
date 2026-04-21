// src/themes/cupertino/index.ts

import { lazy } from "react";
import { PortfolioThemeDefinition } from "../types";
import { ModernTheme } from "../modern"; // Inherits the lazy-loaded Modern components

// 🚀 AAA+ LAZY LOADING: Standard dynamic imports!
// This tells React to automatically look for the "export default" in each file.
const Header = lazy(() => import("./Header"));

// Make sure your Cupertino Hero and Gallery files also use "export default Hero;"
// at the bottom of their files if you update these two as well!
const Hero = lazy(() => import("./Hero"));
const Gallery = lazy(() => import("./Gallery"));

// Define the Theme
export const CupertinoTheme: PortfolioThemeDefinition = {
  ...ModernTheme, // 1. Fallback to the highly-optimized Modern components

  // 2. Overwrite with our new Cupertino lazy-loaded versions
  Header,
  Hero,
  Gallery,
};
