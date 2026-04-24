// src/themes/cupertino/index.ts

import { lazy } from "react";
import { PortfolioThemeDefinition } from "../types";
import { ModernTheme } from "../modern"; // Inherits the lazy-loaded Modern components

// 🚀 1. SYNCHRONOUSLY IMPORT SCHEMAS
// We import JUST the lightweight schema arrays so the Editor can read them instantly.
import { schema as HeaderSchema } from "./Header";
import { schema as HeroSchema } from "./Hero";
import { schema as AboutSchema } from "./About";
import { schema as ContactSchema } from "./Contact";
import { schema as GallerySchema } from "./Gallery"; // Add this when you build the Cupertino Gallery!
import { schema as TeamSchema } from "./Team"; // Add this when you build the Cupertino Gallery!
import { schema as MapSchema } from "./Map"; // Add this when you build the Cupertino Gallery!
import { schema as PricingSchema } from "./Pricing"; // Add this when you build the Cupertino Gallery!
import { schema as LeadFormSchema } from "./LeadForm"; // Add this when you build the Cupertino Gallery!

// 🚀 2. LAZY LOAD COMPONENTS
// The heavy React code stays lazy to protect performance.
const Header = lazy(() => import("./Header"));
const Hero = lazy(() => import("./Hero"));
const Gallery = lazy(() => import("./Gallery"));
const About = lazy(() => import("./About"));
const Contact = lazy(() => import("./Contact"));
const Team = lazy(() => import("./Team"));
const Map = lazy(() => import("./Map"));
const Pricing = lazy(() => import("./Pricing"));
const LeadForm = lazy(() => import("./LeadForm"));

// Define the Theme
export const CupertinoTheme: PortfolioThemeDefinition & { schemas?: any } = {
  ...ModernTheme, // 1. Fallback to the highly-optimized Modern components

  // 2. Overwrite with our new Cupertino lazy-loaded versions
  Header,
  Hero,
  Gallery,
  About,
  Contact,
  Team,
  Map,
  Pricing,
  LeadForm,

  // 🚀 3. THE FIX: Expose the schemas directly to the Section Editor!
  schemas: {
    Header: HeaderSchema,
    Hero: HeroSchema,
    Gallery: GallerySchema,
    About: AboutSchema,
    Contact: ContactSchema,
    Team: TeamSchema,
    Map: MapSchema,
    Pricing: PricingSchema,
    LeadForm: LeadFormSchema,
  },
};
