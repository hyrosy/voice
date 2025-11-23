import { PortfolioThemeDefinition } from '../types';
import Hero from './Hero';
import About from './About';
import Gallery from './Gallery';
import Services from './Services';
import Contact from './Contact';
import ImageSlider from './ImageSlider'; // <-- NEW
import VideoSlider from './VideoSlider'; // <-- NEW
import Header from './Header'; // <-- Import

// Temporary Placeholders
const Stats = () => <div className="py-20 text-center bg-muted">Stats Section (Coming Soon)</div>;
const Demos = () => <div className="py-20 text-center">Demos Section (Coming Soon)</div>;
const Reviews = () => <div className="py-20 text-center bg-muted">Reviews Section (Coming Soon)</div>;

export const ModernTheme: PortfolioThemeDefinition = {
  Header, // <-- Export
  Hero,
  About,
  Gallery,
  Services,
  Contact,
  Stats,
  Demos,
  Reviews,
  ImageSlider, // <-- Export
  VideoSlider, // <-- Export
};