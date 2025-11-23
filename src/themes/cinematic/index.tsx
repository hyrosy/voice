import { PortfolioThemeDefinition } from '../types';
// Import the new sliders
import ImageSlider from './ImageSlider';
import VideoSlider from './VideoSlider';
import Header from './Header'; // <-- Import

// Import base components from Modern (or create specific cinematic versions for these too!)
import { ModernTheme } from '../modern';

const Hero = ModernTheme.Hero; // You should build a Cinematic Hero next!
const About = ModernTheme.About;
const Gallery = ModernTheme.Gallery;
const Services = ModernTheme.Services;
const Contact = ModernTheme.Contact;
const Stats = ModernTheme.Stats;
const Demos = ModernTheme.Demos;
const Reviews = ModernTheme.Reviews;

export const CinematicTheme: PortfolioThemeDefinition = {
  Header, // <-- Export
  Hero,
  About,
  Gallery,
  Services,
  Contact,
  Stats,
  Demos,
  Reviews,
  // Override with the new Cinematic Sliders
  ImageSlider,
  VideoSlider
};