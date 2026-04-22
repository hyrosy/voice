// src/types/sections.ts

// ==========================================
// 1. THE BASE CONTRACT (Shared by all)
// ==========================================
export interface BaseSectionProps<TSettings = Record<string, any>> {
  id: string;
  isVisible: boolean;
  isPreview?: boolean; // 🚀 ADDED THIS: Tells the component if it's in the builder!
  settings: TSettings; // Developer's custom schema data (e.g., "glitchEffect": true)
}

// ==========================================
// 2. SPECIFIC SECTION CONTRACTS (The Purpose)
// ==========================================

// --- HEADER SECTION ---
export interface HeaderCoreData {
  // Branding
  logoText?: string;
  logoImage?: string;
  logoHeight?: number;
  mobileLogoHeight?: number;

  // Layout & Style
  variant?: "transparent" | "centered" | "floating";
  isSticky?: boolean;

  // Announcement Bar
  showAnnouncement?: boolean;
  announcements?: Array<{ id: string; text: string; link?: string }>;
  announcementBgColor?: string;
  announcementTextColor?: string;
  announcementMarquee?: boolean;

  // Mega Menu & Navigation
  autoMenu?: boolean;
  menuType?: "simple" | "mega";
  megaMenuFolders?: Array<{ id: string; label: string }>;
  menuConfig?: Record<
    string,
    { label?: string; visible?: boolean; folderId?: string | null }
  >;
  customNavLinks?: Array<{
    id: string;
    label: string;
    url: string;
    visible?: boolean;
    folderId?: string | null;
  }>;

  // Social Links
  socialInstagram?: string;
  socialTwitter?: string;
  socialYoutube?: string;
  socialImdb?: string;

  // Call to Action
  ctaText?: string;
  ctaLink?: string;
}
export type HeaderSectionProps = BaseSectionProps & { data: HeaderCoreData };

// --- 🚀 HERO SECTION (NEWLY ADDED) ---
export interface HeroCoreData {
  // Layout Architecture
  layout?: "center" | "split-left" | "split-right" | "bottom";
  alignment?: "left" | "center" | "right";

  // Content & Typography
  label?: string; // Eyebrow
  headline?: string;
  animateHeadline?: boolean;
  subheadline?: string;

  // Trust Signals
  showTrustBadge?: boolean;
  trustText?: string;

  // Background Media Engine
  variant?: "static" | "video" | "color";

  // Video Options
  videoUrl?: string;
  mobileVideoUrl?: string;
  mobileVideoFit?: "cover" | "fill" | "contain";

  // Color & Gradient Options
  colorType?: "solid" | "gradient" | "mesh";
  backgroundColor?: string;
  gradientColor1?: string;
  gradientColor2?: string;
  gradientTheme?: "aurora" | "sunset" | "ocean" | "cyberpunk";

  // Static Image Options
  backgroundImage?: string; // Desktop Poster/Image
  mobileBackgroundImage?: string; // Mobile Art Direction
  overlayOpacity?: number;

  // Call to Action
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}
export type HeroSectionProps = BaseSectionProps & { data: HeroCoreData };

// --- BIO SECTION ---
export interface BioCoreData {
  actorName: string;
  bioText: string;
  headshotUrl: string;
  resumeUrl?: string;
  stats?: Array<{ label: string; value: string }>;
}
export type BioSectionProps = BaseSectionProps & { data: BioCoreData };

// --- GALLERY SECTION ---
export interface GalleryItem {
  id: string;
  url: string;
  type: "image" | "video";
  caption?: string;
  thumbnailUrl?: string;
}
export interface GalleryCoreData {
  title: string;
  description?: string;
  items: GalleryItem[];
}
export type GallerySectionProps = BaseSectionProps & { data: GalleryCoreData };

// --- VIDEO / DEMO REEL SECTION ---
export interface VideoReelCoreData {
  title: string;
  videoUrl: string;
  posterUrl?: string;
  duration?: string;
}
export type VideoReelSectionProps = BaseSectionProps & {
  data: VideoReelCoreData;
};

// --- SERVICES / PRICING SECTION ---
export interface ServiceItem {
  id: string;
  title: string;
  price?: string;
  description: string;
  features?: string[];
  bookingUrl?: string;
}
export interface ServicesCoreData {
  title: string;
  subtitle?: string;
  items: ServiceItem[];
}
export type ServicesSectionProps = BaseSectionProps & {
  data: ServicesCoreData;
};

// --- CONTACT SECTION ---
export interface ContactCoreData {
  title: string;
  email: string;
  phone?: string;
  location?: string;
  socialLinks?: Array<{ platform: string; url: string; icon?: string }>;
  onSendMessage?: (message: {
    name: string;
    email: string;
    body: string;
  }) => Promise<void>;
}
export type ContactSectionProps = BaseSectionProps & { data: ContactCoreData };

// --- LEGACY SHOP SECTION ---
export interface LegacyShopProduct {
  title: string;
  price: string;
  description: string;
  buttonText: string;
  link: string;
}
export interface ShopCoreData {
  title: string;
  subheadline?: string;
  variant?: "grid" | "carousel" | "spotlight";
  products: LegacyShopProduct[];
}
export type ShopSectionProps = BaseSectionProps & { data: ShopCoreData };

// --- DYNAMIC STORE SECTION ---
export interface DynamicStoreCoreData {
  title: string;
  subtitle?: string;
  layout?: "grid" | "carousel";
  maxProductsToShow?: number;
}
export type DynamicStoreSectionProps = BaseSectionProps & {
  data: DynamicStoreCoreData;
};
