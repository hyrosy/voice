// src/types/sections.ts

// ==========================================
// 1. THE BASE CONTRACT (Shared by all)
// ==========================================
// Every single section in your app will automatically get these props.
// "TSettings" allows the developer to define their own custom config types.
export interface BaseSectionProps<TSettings = Record<string, any>> {
  id: string;
  isVisible: boolean;
  
  // ZONE B: The "Experience" Data
  // This is where the developer's custom schema data lives (e.g., "glitchEffect": true)
  settings: TSettings; 
}

// ==========================================
// 2. SPECIFIC SECTION CONTRACTS (The Purpose)
// ==========================================

// --- HEADER SECTION ---
// PURPOSE: Navigation and Identity
export interface HeaderCoreData {
  title: string;          // e.g., "Raja Alem"
  subtitle?: string;      // e.g., "Professional Voice Actor"
  logoUrl?: string;       
  navLinks: Array<{ label: string; url: string }>;
}
// The Type the Developer uses:
export type HeaderSectionProps = BaseSectionProps & { data: HeaderCoreData };


// --- BIO SECTION ---
// PURPOSE: Introduction and Personal Details
export interface BioCoreData {
  actorName: string;
  bioText: string;        // Rich text or plain text
  headshotUrl: string;
  resumeUrl?: string;     // Optional downloadable resume
  stats?: Array<{ label: string; value: string }>; // e.g., "Height: 5'9", "Eyes: Brown"
}
export type BioSectionProps = BaseSectionProps & { data: BioCoreData };


// --- GALLERY SECTION ---
// PURPOSE: Photo Grid / Carousel
export interface GalleryItem {
  id: string;
  url: string;
  type: 'image' | 'video';
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
// PURPOSE: Showcasing work
export interface VideoReelCoreData {
  title: string;
  videoUrl: string;       // YouTube/Vimeo/Supabase URL
  posterUrl?: string;     // Cover image
  duration?: string;
}
export type VideoReelSectionProps = BaseSectionProps & { data: VideoReelCoreData };


// --- SERVICES / PRICING SECTION ---
// PURPOSE: Selling skills or packages
export interface ServiceItem {
  id: string;
  title: string;          // e.g., "Commercial Voiceover"
  price?: string;         // e.g., "$200/hr"
  description: string;
  features?: string[];
  bookingUrl?: string;    // If this service links to a specific order page
}
export interface ServicesCoreData {
  title: string;
  subtitle?: string;
  items: ServiceItem[];
}
export type ServicesSectionProps = BaseSectionProps & { data: ServicesCoreData };


// --- CONTACT SECTION ---
// PURPOSE: Lead generation
export interface ContactCoreData {
  title: string;
  email: string;
  phone?: string;
  location?: string;      // e.g., "Marrakesh, Morocco"
  socialLinks?: Array<{ platform: string; url: string; icon?: string }>;
  
  // The Logic Hook: The developer MUST use this to handle form submission
  onSendMessage?: (message: { name: string; email: string; body: string }) => Promise<void>;
}
export type ContactSectionProps = BaseSectionProps & { data: ContactCoreData };