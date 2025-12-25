import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import Navbar from './components/Navbar'; // Import Navbar
import Footer from './components/Footer'; // Import Footer
import HomePage from './pages/HomePage';
//import OptInPage from './pages/OptInPage';
//import ThankYouPage from './pages/ThankYouPage';
import PortfolioPage from './pages/PortfolioPage';
import PrivacyPolicyPage from './components/PrivacyPolicy.tsx';
import ContactUsPage from './pages/ContactUsPage'; // Import the Contact Us page
import TermsofService from './components/TermsofService.tsx';
import TermsandConditions from './components/TermsandConditions.tsx';
//import MembersPage from './pages/Members'; // Import MembersPage if needed
//import CinematoGraphyPage from './pages/CenimatoGraphy.tsx';
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
import { supabase } from './supabaseClient'; // <-- Import supabase client
import AdminOrderDetailPage from './pages/AdminOrderDetailPage'; // <-- Import the new page
import AdminActorListPage from './pages/AdminActorListPage';   // <-- Import Actor List
import AdminClientListPage from './pages/AdminClientListPage';  // <-- Import Client List
import CreateProfilePromptPage from './pages/CreateProfilePromptPage'; // <-- Import new page
import FavoriteActorsPage from './pages/FavoriteActorsPage'; // <-- 1. Import the new page
import MessagesPage from './pages/MessagesPage'; // <-- Import new page
// --- NEW: Actor Dashboard Layout & Pages ---
import ActorDashboardLayout from './layouts/ActorDashboardLayout';
import DashboardOrders from './pages/dashboard/DashboardOrders';
import DashboardProfile from './pages/dashboard/DashboardProfile';
import DashboardServices from './pages/dashboard/DashboardServices';
import DashboardDemos from './pages/dashboard/DashboardDemos';
import DashboardLibrary from './pages/dashboard/DashboardLibrary';
import ActorEarningsPage from './pages/dashboard/ActorEarningsPage'; // <-- 1. Import the new page
import AdminPayoutsPage from './pages/AdminPayoutsPage'; // <-- 1. Import the new page
import ActorPayoutSettingsPage from './pages/dashboard/ActorPayoutSettingsPage'; // <-- 1. Import the new page
import PortfolioBuilderPage from './pages/dashboard/PortfolioBuilderPage.tsx';
import PortfolioRenderer from './pages/PortfolioRenderer'; // <-- Import it
import AdminDomainListPage from './pages/AdminDomainListPage';
import DomainMarketplace from './pages/marketplace/DomainMarketplace'; // Adjust path
import DomainCheckout from './pages/marketplace/DomainCheckout';     // Adjust path
import DomainThankYouPage from './pages/marketplace/DomainThankYouPage';
import AdminDomainOrderDetailPage from './pages/AdminDomainOrderDetailPage';
import DomainOrderPage from './pages/marketplace/DomainOrderPage';


// --- 1. Create a Layout Component to handle conditional Footer ---
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  // Pages where we want to HIDE the footer for a full-screen "App" feel
  const hideFooterPaths = [
    '/dashboard', 
    '/messages', 
    '/client-dashboard',
    '/admin',
    '/pro', // <-- ADD THIS LINE
    // Add auth pages if you want them clean too:
    // '/actor-login', '/client-auth', '/actor-signup' 
  ];

  const hideNavbarPaths = [
    '/pro', 
    // You can add others here if you want, e.g. '/login', '/register'
  ];

  const shouldHideFooter = hideFooterPaths.some(path => location.pathname.startsWith(path));
  const shouldHideNavbar = hideNavbarPaths.some(path => location.pathname.startsWith(path));
  return (
    <>
      {!shouldHideNavbar && <Navbar />}      

      <main className={`flex-grow ${shouldHideNavbar ? "" : "pt-20"}`}>
                {children}
      </main>

      {!shouldHideFooter && <Footer />}
    </>
  );
};

function App() {
  
  useEffect(() => {
    // Initialize EmailJS with your Public Key
    emailjs.init('LOZrhOD88Fa4aQQlz');
  }, []);

  // --- ADD THIS useEffect FOR AUTH LISTENER ---
  useEffect(() => {
    // Listen for changes in authentication state
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Supabase Auth Event:', event, session); // Log events for debugging

        // This listener automatically handles session updates.
        // When the user clicks the verification link and lands back on your site
        // (even if emailRedirectTo is set), this listener will detect the updated
        // session information containing the now-verified user.

        // You could add logic here if needed, like redirecting based on session status,
        // but often just letting components re-render based on supabase.auth.getUser()
        // is sufficient.
      }
    );

    // Cleanup function to unsubscribe when the App component unmounts
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount
  // --- END OF AUTH LISTENER useEffect --

  return (
    <Router>
      <ScrollToTop />
      <main className="flex-grow">
        
        <Layout>
        <Routes>
{/* start of temporary disabled routes
        <Route path="/members" element={<MembersPage />} /> {/* Add route for Members Page */}
        <Route path="/privacy-policy" element={<PrivacyPolicyPage/>}/>
        <Route path="/terms-of-service" element={<TermsofService/>}/>
        <Route path="/terms-of-conditions" element={<TermsandConditions/>}/>
        <Route path="/contact" element={<ContactUsPage />} /> {/* Add route for Contact Us */}
{/*    <Route path="/opt-in/:planId" element={<OptInPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/software-development" element={<SoftwareServicesPage />} />
        <Route path="/digital-marketing" element={<MarketingServices />} />
        <Route path="/customized-package" element={<CustomizedPackages />} />
        <Route path="/cinema-portfolio" element={<CinematoGraphyPage />} />

{/* end of temporary disabled routes*/}
        <Route path="/" element={<HomePage />} />
        <Route path="/my-favorites" element={<FavoriteActorsPage />} /> {/* <-- 2. Add this new route */}
        <Route path="/Voiceover" element={<VoiceOverLandingPage />} />
        <Route path="/actor/:actorName" element={<ActorProfilePage />} />
        <Route path="/dashboard" element={<ActorDashboardPage />} />
        <Route path="/order/:orderId" element={<ClientOrderPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/client-auth" element={<ClientAuthPage />} />
        <Route path="/client-dashboard" element={<ClientDashboardPage />} />
        <Route path="/actor-login" element={<ActorLoginPage />} />
        <Route path="/actor-signup" element={<ActorSignUpPage />} />
        <Route path="/my-shortlist" element={<MyShortlistPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:conversationId" element={<MessagesPage />} />
        <Route path="/admin/order/:orderId" element={<AdminOrderDetailPage />} /> {/* <-- Add this route */}
        <Route path="/admin/actors" element={<AdminActorListPage />} />   {/* <-- Add Actor route */}
        <Route path="/admin/clients" element={<AdminClientListPage />} />  {/* <-- Add Client route */}
        <Route path="/admin/domains" element={<AdminDomainListPage />} />
        <Route path="/marketplace/order/:id/thank-you" element={<DomainThankYouPage />} />
        <Route path="/admin/domains/order/:id" element={<AdminDomainOrderDetailPage />} />
        <Route path="/marketplace/order/:id/status" element={<DomainOrderPage />} />
        <Route path="/marketplace/domains" element={<DomainMarketplace />} />
        <Route path="/marketplace/domains/:id/checkout" element={<DomainCheckout />} />
        <Route path="/create-profile" element={<CreateProfilePromptPage />} /> {/* <-- Add new route */}
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/admin/payouts" element={<AdminPayoutsPage />} />
        {/* --- END NEW ROUTES --- */}
        {/* --- NEW Actor Dashboard Layout --- */}
          <Route path="/dashboard" element={<ActorDashboardLayout />}>
            <Route index element={<DashboardOrders />} /> {/* /dashboard */}
            <Route path="profile" element={<DashboardProfile />} /> {/* /dashboard/profile */}
            <Route path="messages" element={<MessagesPage />} />
            <Route path="messages/:conversationId" element={<MessagesPage />} />
            <Route path="services" element={<DashboardServices />} /> {/* /dashboard/services */}
            <Route path="demos" element={<DashboardDemos />} /> {/* /dashboard/demos */}
            <Route path="library" element={<DashboardLibrary />} /> {/* /dashboard/library */}
            <Route path="earnings" element={<ActorEarningsPage />} />
            <Route path="payout-settings" element={<ActorPayoutSettingsPage />} />
            <Route path="Portfolio" element={<PortfolioBuilderPage />} /> 
          </Route>
          <Route path="/pro/:slug" element={<PortfolioRenderer />} />

      </Routes>
      </Layout>
      </main>
    </Router>
  );
}

export default App;