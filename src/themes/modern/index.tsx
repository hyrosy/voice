// src/themes/modern/index.tsx

import React, { lazy } from "react";
import { PortfolioThemeDefinition } from "../types";

// 🚀 AAA+ LAZY LOADING: Replaced static imports with dynamic imports.
// Webpack will now split these into tiny, individual JS chunks.
const Header = lazy(() => import("./Header"));
const Hero = lazy(() => import("./Hero"));
const About = lazy(() => import("./About"));
const Gallery = lazy(() => import("./Gallery"));
const Contact = lazy(() => import("./Contact"));
const ImageSlider = lazy(() => import("./ImageSlider"));
const VideoSlider = lazy(() => import("./VideoSlider"));
const ServicesShowcase = lazy(() => import("./ServicesShowcase"));
const Team = lazy(() => import("./Team"));
const Map = lazy(() => import("./Map"));
const Pricing = lazy(() => import("./Pricing"));
const Shop = lazy(() => import("./Shop"));
const LeadForm = lazy(() => import("./LeadForm"));

// Handle named exports dynamically
const DynamicStore = lazy(() =>
  import("./DynamicStore").then((module) => ({ default: module.DynamicStore }))
);

// Temporary Placeholders (Kept inline because they are tiny and don't need splitting)
const Stats = () => (
  <div className="py-20 text-center bg-muted">Stats Section (Coming Soon)</div>
);
const Demos = () => (
  <div className="py-20 text-center">Demos Section (Coming Soon)</div>
);
const Reviews = () => (
  <div className="py-20 text-center bg-muted">
    Reviews Section (Coming Soon)
  </div>
);

export const ModernTheme: PortfolioThemeDefinition = {
  Header,
  Hero,
  About,
  Gallery,
  ServicesShowcase,
  Contact,
  Stats,
  Reviews,
  ImageSlider,
  VideoSlider,
  Team,
  Map,
  Pricing,
  Shop,
  LeadForm,
  DynamicStore,
};
