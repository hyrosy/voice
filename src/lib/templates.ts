import { PortfolioSection } from "../types/portfolio";

export interface PortfolioTemplate {
  id: string;
  name: string;
  description: string;
  sections: PortfolioSection[];
}

export const PORTFOLIO_TEMPLATES: PortfolioTemplate[] = [
  {
    id: 'actor-standard',
    name: 'Actor Standard',
    description: 'Classic layout for film & TV actors. Focus on headshots and credits.',
    sections: [
      { id: 'header', type: 'header', isVisible: true, data: { logoText: "My Name" } },
      { id: 'hero', type: 'hero', isVisible: true, data: { headline: "Actor & Performer", subheadline: "Based in LA & NY" } },
      { id: 'about', type: 'about', isVisible: true, data: { title: "Biography" } },
      { id: 'gallery', type: 'gallery', isVisible: true, data: { title: "Headshots" } },
      { id: 'video_slider', type: 'video_slider', isVisible: true, data: { title: "Showreel" } },
      { id: 'contact', type: 'contact', isVisible: true, data: { title: "Contact Representation" } },
    ]
  },
  {
    id: 'voiceover-pro',
    name: 'Voiceover Pro',
    description: 'Audio-first layout. Perfect for voice actors and podcasters.',
    sections: [
      { id: 'header', type: 'header', isVisible: true, data: { logoText: "VO Artist" } },
      { id: 'hero', type: 'hero', isVisible: true, data: { headline: "The Voice You Need", subheadline: "Commercial • Animation • Narration" } },
      { id: 'services', type: 'services_showcase', isVisible: true, data: { title: "Demos & Rates", showDemos: true } },
      { id: 'about', type: 'about', isVisible: true, data: { title: "Studio Specs", features: ["Neumann U87", "SourceConnect"] } },
      { id: 'reviews', type: 'reviews', isVisible: true, data: { title: "Happy Clients" } },
      { id: 'lead_form', type: 'lead_form', isVisible: true, data: { title: "Request a Quote", buttonText: "Book Session" } },
    ]
  },
  {
    id: 'creator-shop',
    name: 'Creator & Shop',
    description: 'Sales-focused layout for influencers selling merch or digital products.',
    sections: [
      { id: 'header', type: 'header', isVisible: true, data: { logoText: "Creator Brand" } },
      { id: 'hero', type: 'hero', isVisible: true, data: { headline: "Digital Products", subheadline: "LUTs, Presets, and Guides" } },
      { id: 'shop', type: 'shop', isVisible: true, data: { title: "Featured Products", variant: "spotlight" } },
      { id: 'stats', type: 'stats', isVisible: true, data: { customStats: [{label: "Followers", value: "100K+"}] } },
      { id: 'contact', type: 'contact', isVisible: true, data: { title: "Brand Deals" } },
    ]
  }
];  