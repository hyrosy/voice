// src/themes/cupertino/index.ts

import { lazy } from "react";
import { PortfolioThemeDefinition } from "../types";
import { ModernTheme } from "../modern"; // Inherits the lazy-loaded Modern components

// 🚀 AAA+ LAZY LOADING: Dynamic imports for the Cupertino overrides
// Using the .then() trick to handle your Named Exports safely
const Header = lazy(() =>
  import("./Header").then((module) => ({ default: module.Header }))
);
const Hero = lazy(() =>
  import("./Hero").then((module) => ({ default: module.Hero }))
);
const Gallery = lazy(() =>
  import("./Gallery").then((module) => ({ default: module.Gallery }))
);

// Define the Theme
export const CupertinoTheme: PortfolioThemeDefinition = {
  ...ModernTheme, // 1. Fallback to the highly-optimized Modern components

  // 2. Overwrite with our new Cupertino lazy-loaded versions
  Header,
  Hero,
  Gallery,
};
