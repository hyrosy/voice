import React from 'react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import PricingSection from '../components/PricingSection';
import ImageCarousel3D from '../components/ImageCarousel3D';
import VideographySection from '../components/VideoCarouselSection'; // Import VideoCarouselSection
import DigitalMarketingSection from '../components/DigitalMarketingSection'; // Import DigitalMarketingSection
import RealEstateManagementSection from '../components/RealEstateManagementSection'; // Import RealEstateManagementSection
import DigitalDevelopmentSection from '../components/DigitalDevelopmentSection'

import MembersSection from '../components/MembersSection.tsx';


const HomePage: React.FC = () => {
  return (
    <>
      <main>
        <Hero />
        <MembersSection />
        <DigitalDevelopmentSection lottieUrl="https://d2ah09ed4k10ng.cloudfront.net/json/Animation+-+1748633457719.json" />
        
        <VideographySection /> {/* Add Video Carousel Section */}
        <DigitalMarketingSection lottieUrl="https://ucpmarocgo.s3.us-east-1.amazonaws.com/json/socialmedialottiesucpmaroc.json" />
        <RealEstateManagementSection />
        
        <Services />
        <PricingSection />
        <ImageCarousel3D />

      </main>
    </>
  );
};

export default HomePage;