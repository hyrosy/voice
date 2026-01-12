import { PortfolioThemeDefinition } from '../types';
import { ModernTheme } from '../modern'; // Import Modern as a fallback base

// Import our new "Apple-style" components
import { Header } from './Header';
import { Hero } from './Hero';
import { Gallery } from './Gallery';

// Define the Theme
export const CupertinoTheme: PortfolioThemeDefinition = {
  ...ModernTheme, // 1. Copy EVERYTHING from Modern first (Bio, Contact, Shop, etc.)
  
  // 2. Overwrite with our new Cupertino versions
  Header,
  Hero,
  Gallery,
};