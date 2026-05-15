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
  schemas: {
    Header: [
      {
        id: "variant",
        type: "select",
        label: "Header Variant",
        options: [
          { value: "transparent", label: "Transparent (Standard)" },
          { value: "centered", label: "Editorial (Centered Logo)" },
          { value: "floating", label: "Floating Island (Pill Shape)" },
        ],
        defaultValue: "transparent",
      },
      {
        id: "isSticky",
        type: "toggle",
        label: "Sticky Header",
        defaultValue: true,
      },
    ],
    Hero: [
      {
        id: "layout",
        type: "select",
        label: "Hero Structure",
        options: [
          { value: "center", label: "Immersive Center" },
          { value: "split-left", label: "Split (Text Left)" },
          { value: "split-right", label: "Split (Text Right)" },
          { value: "bottom", label: "Bottom Aligned" },
        ],
        defaultValue: "center",
      },
      {
        id: "alignment",
        type: "select",
        label: "Text Alignment",
        options: [
          { value: "left", label: "Left Aligned" },
          { value: "center", label: "Center Aligned" },
          { value: "right", label: "Right Aligned" },
        ],
        defaultValue: "center",
      },
    ],
    About: [
      {
        id: "variant",
        type: "select",
        label: "About Section Style",
        options: [
          { value: "split", label: "Standard Split (Bio + Media)" },
          { value: "profile", label: "Actor Profile (Bio + Media + Stats Grid)" },
          { value: "simple", label: "Minimal (Centered Text Only)" },
        ],
        defaultValue: "split",
      },
      {
        id: "layout",
        type: "select",
        label: "Media Position",
        options: [
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ],
        defaultValue: "right",
      },
      {
        id: "imageFilter",
        type: "select",
        label: "Image Style",
        options: [
          { value: "grayscale", label: "Cinematic Grayscale" },
          { value: "color", label: "Original Color" },
        ],
        defaultValue: "grayscale",
      },
    ],
    Contact: [
      {
        id: "variant",
        type: "select",
        label: "Contact Style",
        options: [
          { value: "minimal", label: "Minimal (Center Text)" },
          { value: "split", label: "Split (Image + Info)" },
          { value: "card", label: "Floating Card (Premium)" },
        ],
        defaultValue: "minimal",
      },
    ],
    Team: [
      {
        id: "variant",
        type: "select",
        label: "Team Display Style",
        options: [
          { value: "grid", label: "Classic Grid (Equal)" },
          { value: "spotlight", label: "Founder Spotlight (First Large)" },
          { value: "carousel", label: "Horizontal Scroll (Compact)" },
        ],
        defaultValue: "grid",
      },
    ],
    Map: [
      {
        id: "variant",
        type: "select",
        label: "Map Style",
        options: [
          { value: "standard", label: "Standard (Full Width)" },
          { value: "dark", label: "Cinematic (Dark Mode)" },
          { value: "card", label: "Overlay Card (Boxed)" },
        ],
        defaultValue: "standard",
      },
      {
        id: "height",
        type: "select",
        label: "Container Height",
        options: [
          { value: "small", label: "Small (300px)" },
          { value: "medium", label: "Medium (50vh)" },
          { value: "large", label: "Large (70vh - Immersive)" },
        ],
        defaultValue: "medium",
      },
    ],
    Pricing: [
      {
        id: "variant",
        type: "select",
        label: "Display Style",
        options: [
          { value: "cards", label: "Grid Cards (Standard SaaS)" },
          { value: "slider", label: "Carousel (Horizontal Scroll)" },
          { value: "list", label: "Rate Card (Minimal List)" },
        ],
        defaultValue: "cards",
      },
    ],
    Shop: [
      {
        id: "variant",
        type: "select",
        label: "Display Style",
        options: [
          { value: "grid", label: "Grid (Standard)" },
          { value: "carousel", label: "Carousel (Horizontal)" },
          { value: "spotlight", label: "Spotlight (Hero Product)" },
        ],
        defaultValue: "grid",
      },
    ],
    LeadForm: [
      {
        id: "variant",
        type: "select",
        label: "Layout Architecture",
        options: [
          { value: "centered", label: "Centered Box (Standard)" },
          { value: "split", label: "Split Screen (Image + Form)" },
          { value: "minimal", label: "Minimal (Clean / No Box)" },
        ],
        defaultValue: "centered",
      },
    ],
  },
};
