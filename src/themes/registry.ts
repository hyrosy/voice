import { PortfolioThemeDefinition } from './types';
import { ModernTheme } from './modern';
import { CinematicTheme } from './cinematic'; // Import it

// Map of ID -> Theme Object
export const THEME_REGISTRY: Record<string, PortfolioThemeDefinition> = {
  'modern': ModernTheme,
  'cinematic': CinematicTheme, // Add it to registry
  // We will add 'cinematic': CinematicTheme here later!
};

export const DEFAULT_THEME = ModernTheme;