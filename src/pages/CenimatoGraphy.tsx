import React from 'react';
import VideoGraphyPage from '../components/VideoGraphyPage';
import Navbar from '../components/Navbar';
import CinematographyHero from '../components/CinemaHero'
const CinematoGraphyPage: React.FC = () => {
  return (
    <>
      <Navbar />
      <main className="portfolio-page">
        <CinematographyHero />
        <VideoGraphyPage />
      </main>
      

    </>
  );
};

export default CinematoGraphyPage;