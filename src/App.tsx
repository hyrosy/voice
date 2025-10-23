import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import Navbar from './components/Navbar'; // Import Navbar
import Footer from './components/Footer'; // Import Footer
import HomePage from './pages/HomePage';
//import OptInPage from './pages/OptInPage';
//import ThankYouPage from './pages/ThankYouPage';
//import PortfolioPage from './pages/PortfolioPage';
//import PrivacyPolicyPage from './components/PrivacyPolicy.tsx';
//import ContactUsPage from './pages/ContactUsPage'; // Import the Contact Us page
//import TermsofService from './components/TermsofService.tsx';
//import TermsandConditions from './components/TermsandConditions.tsx';
//import MembersPage from './pages/Members'; // Import MembersPage if needed
import CinematoGraphyPage from './pages/CenimatoGraphy.tsx';
//import CustomizedPackages from './pages/CustomizedPackages.tsx';
//import SoftwareServicesPage from './pages/SoftwareDev.tsx'
import VoiceOverLandingPage from './pages/VoiceOverLandingPage'
//import MarketingServices from './pages/MarketingServices'
import ActorProfilePage from './pages/ActorProfilePage';
// import ActorAuthPage from './pages/ActorAuthPage.tsx';
import ActorDashboardPage from './pages/ActorDashboardPage';
import ClientOrderPage from './pages/ClientOrderPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ClientAuthPage from './pages/ClientAuthPage';
import ClientDashboardPage from './pages/ClientDashboardPage';
import ActorLoginPage from './pages/ActorLoginPage';
import ActorSignUpPage from './pages/ActorSignUpPage';
import MyShortlistPage from './pages/MyShortlistPage';
import ScrollToTop from './components/ScrollToTop'; // 1. Import the new component




function App() {
  useEffect(() => {
    // Initialize EmailJS with your Public Key
    emailjs.init('LOZrhOD88Fa4aQQlz');
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Navbar />
      <main className="flex-grow pt-20">
        <Routes>


{/* start of temporary disabled routes
        <Route path="/members" element={<MembersPage />} /> {/* Add route for Members Page */}
{/*     <Route path="/privacy-policy" element={<PrivacyPolicyPage/>}/>
        <Route path="/terms-of-service" element={<TermsofService/>}/>
        <Route path="/terms-of-conditions" element={<TermsandConditions/>}/>
        <Route path="/contact" element={<ContactUsPage />} /> {/* Add route for Contact Us */}
{/*    <Route path="/opt-in/:planId" element={<OptInPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/software-development" element={<SoftwareServicesPage />} />
        <Route path="/digital-marketing" element={<MarketingServices />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/customized-package" element={<CustomizedPackages />} />

{/* end of temporary disabled routes*/}

        <Route path="/" element={<HomePage />} />
        <Route path="/cinema-portfolio" element={<CinematoGraphyPage />} />
        <Route path="/voiceover" element={<VoiceOverLandingPage />} />
        <Route path="/actor/:actorName" element={<ActorProfilePage />} />
        <Route path="/dashboard" element={<ActorDashboardPage />} />
        <Route path="/order/:orderId" element={<ClientOrderPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/client-auth" element={<ClientAuthPage />} />
        <Route path="/client-dashboard" element={<ClientDashboardPage />} />
        <Route path="/actor-login" element={<ActorLoginPage />} />
        <Route path="/actor-signup" element={<ActorSignUpPage />} />
        <Route path="/my-shortlist" element={<MyShortlistPage />} />
      </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;