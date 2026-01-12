import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import Navbar from './components/Navbar'; // Import Navbar
import Footer from './components/Footer'; // Import Footer
//import HomePage from './pages/HomePage';
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
//import PortfolioRenderer from './pages/PortfolioRenderer'; // <-- Import it
import AdminDomainListPage from './pages/AdminDomainListPage';
import DomainMarketplace from './pages/marketplace/DomainMarketplace'; // Adjust path
import DomainCheckout from './pages/marketplace/DomainCheckout';     // Adjust path
import DomainThankYouPage from './pages/marketplace/DomainThankYouPage';
import AdminDomainOrderDetailPage from './pages/AdminDomainOrderDetailPage';
import DomainOrderPage from './pages/marketplace/DomainOrderPage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage.tsx';
import OrdersPage from './pages/dashboard/OrdersPage.tsx';
import LeadsPage from './pages/dashboard/LeadsPage.tsx';
import SettingsPage from './pages/dashboard/SettingsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react'; // Added for the loading spinner
const HomePage = lazy(() => import('./pages/HomePage'));
const PortfolioRenderer = lazy(() => import('./pages/PortfolioRenderer'));

// Define main domains globally
const MAIN_DOMAINS = ['ucpmaroc.com', 'www.ucpmaroc.com', 'localhost', '127.0.0.1'];

const DomainAwareHome = () => {
  const currentHostname = window.location.hostname;
  const isMainApp = MAIN_DOMAINS.some(domain => currentHostname.includes(domain));

  if (!isMainApp) {
    // It is a custom domain -> Load Portfolio Renderer
    return <PortfolioRenderer customDomain={currentHostname} />;
  }

  // It is the main site -> Load Home Page
  return <HomePage />;
};

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data stays "fresh" for 5 minutes
      retry: 1, 
    },
  },
});

// --- UPDATED LAYOUT COMPONENT ---
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  // 1. Check if we are on a custom domain (e.g. rajaalemnari.com)
  const currentHostname = window.location.hostname;
  const isCustomDomain = !MAIN_DOMAINS.some(domain => currentHostname.includes(domain));

  // 2. Define paths where footer/navbar should hide on the MAIN site
  const hideFooterPaths = [
    '/dashboard', 
    '/messages', 
    '/client-dashboard',
    '/admin',
    '/pro', 
  ];

  const hideNavbarPaths = [
    '/pro', 
  ];

  // 3. Logic: Hide if it's a Custom Domain OR if the path matches the list
  const shouldHideFooter = isCustomDomain || hideFooterPaths.some(path => location.pathname.startsWith(path));
  const shouldHideNavbar = isCustomDomain || hideNavbarPaths.some(path => location.pathname.startsWith(path));

  return (
    <>
      {!shouldHideNavbar && <Navbar />}      

      <main className={`flex-grow ${shouldHideNavbar ? "" : "pt-0"}`}>
        {children}
      </main>

      {!shouldHideFooter && <Footer />}
    </>
  );
};

function App() {
  
  useEffect(() => {
    emailjs.init('LOZrhOD88Fa4aQQlz');
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Supabase Auth Event:', event, session); 
      }
    );
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ScrollToTop />
        <main className="flex-grow">
          <Layout>
            {/* Added Suspense Wrapper for Lazy Loading */}
            <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<DomainAwareHome />} />
                <Route path="/my-favorites" element={<FavoriteActorsPage />} /> 
                <Route path="/Voiceover" element={<VoiceOverLandingPage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage/>}/>
                <Route path="/terms-of-service" element={<TermsofService/>}/>
                <Route path="/terms-of-conditions" element={<TermsandConditions/>}/>
                <Route path="/contact" element={<ContactUsPage />} /> 
                <Route path="/pro/:slug" element={<PortfolioRenderer />} />

                {/* Actor/User Routes */}
                <Route path="/actor/:actorName" element={<ActorProfilePage />} />
                <Route path="/dashboard" element={<ActorDashboardPage />} />
                <Route path="/order/:orderId" element={<ClientOrderPage />} />
                <Route path="/actor-login" element={<ActorLoginPage />} />
                <Route path="/actor-signup" element={<ActorSignUpPage />} />
                <Route path="/my-shortlist" element={<MyShortlistPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/messages/:conversationId" element={<MessagesPage />} />
                <Route path="/create-profile" element={<CreateProfilePromptPage />} /> 

                {/* Client Routes */}
                <Route path="/client-auth" element={<ClientAuthPage />} />
                <Route path="/client-dashboard" element={<ClientDashboardPage />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/order/:orderId" element={<AdminOrderDetailPage />} /> 
                <Route path="/admin/actors" element={<AdminActorListPage />} />   
                <Route path="/admin/clients" element={<AdminClientListPage />} />  
                <Route path="/admin/domains" element={<AdminDomainListPage />} />
                <Route path="/admin/domains/order/:id" element={<AdminDomainOrderDetailPage />} />
                <Route path="/admin/payouts" element={<AdminPayoutsPage />} />

                {/* Marketplace Routes */}
                <Route path="/marketplace/domains" element={<DomainMarketplace />} />
                <Route path="/marketplace/domains/:id/checkout" element={<DomainCheckout />} />
                <Route path="/marketplace/order/:id/thank-you" element={<DomainThankYouPage />} />
                <Route path="/marketplace/order/:id/status" element={<DomainOrderPage />} />
                
                {/* Dashboard Layout Routes */}
                <Route path="/dashboard" element={<ActorDashboardLayout />}>
                  <Route index element={<DashboardOrders />} /> 
                  <Route path="profile" element={<DashboardProfile />} /> 
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="messages/:conversationId" element={<MessagesPage />} />
                  <Route path="services" element={<DashboardServices />} /> 
                  <Route path="demos" element={<DashboardDemos />} /> 
                  <Route path="library" element={<DashboardLibrary />} /> 
                  <Route path="earnings" element={<ActorEarningsPage />} />
                  <Route path="payout-settings" element={<ActorPayoutSettingsPage />} />
                  <Route path="Portfolio" element={<PortfolioBuilderPage />} /> 
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="Orders" element={<OrdersPage />} />
                  <Route path="leads" element={<LeadsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Routes>
            </Suspense>
          </Layout>
        </main>
      </Router>
    </QueryClientProvider>
  );
}

export default App;