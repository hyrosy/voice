import { PortfolioThemeDefinition } from '../types';

// --- 1. Import Your Cinematic-Specific Components ---
import ImageSlider from './ImageSlider';
import VideoSlider from './VideoSlider';
import Header from './Header';
import LeadForm from '../modern/LeadForm';

// --- 2. Import the Base Theme to Borrow From ---
import { ModernTheme } from '../modern';

// --- 3. Create the Theme Definition ---
export const CinematicTheme: PortfolioThemeDefinition = {
  // A. Use your new Cinematic components
  Header,       
  ImageSlider,
  VideoSlider,
LeadForm,
  // B. Fallback to Modern for everything else (prevents crashes!)
  Hero: ModernTheme.Hero,
  About: ModernTheme.About,
  Gallery: ModernTheme.Gallery,
  ServicesShowcase: ModernTheme.ServicesShowcase, // <-- WAS MISSING
  Contact: ModernTheme.Contact,
  Stats: ModernTheme.Stats,
  Reviews: ModernTheme.Reviews,
  Team: ModernTheme.Team,                         // <-- WAS MISSING
  Map: ModernTheme.Map,                           // <-- WAS MISSING
  Pricing: ModernTheme.Pricing,                    // <-- WAS MISSING
  Shop: ModernTheme.Pricing,                    // <-- WAS MISSING
  };
