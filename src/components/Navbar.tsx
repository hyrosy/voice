import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { 
  Menu, X, Facebook, Twitter, Instagram, ChevronRight, Home, Users, 
  Briefcase, Package, Phone, Youtube, GalleryHorizontalEnd, BracesIcon, 
  AudioLinesIcon, MegaphoneIcon, LogIn, UserCircle, UserCheck, ChevronDown
} from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);

  // --- (useEffect hooks for scroll and body overflow are correct) ---
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  // --- (Data arrays for menu items are correct) ---
  const allMenuItems = [
    { icon: Home, label: 'Home', to: '/', type: 'link' },
    { icon: AudioLinesIcon, label: 'Voice Over', to: '/voiceover', type: 'link' },
    { icon: Youtube, label: 'Cinematography', to: '/cinema-portfolio', type: 'link' },
    { icon: BracesIcon, label: 'Software Development', to: '/software-development', type: 'link' },
    { icon: MegaphoneIcon, label: 'Digital Marketing', to: '/digital-marketing', type: 'link' },
    { icon: GalleryHorizontalEnd, label: 'Gallery Room', to: '/portfolio', type: 'link' },
    { icon: Package, label: 'Packages', to: '/#packages', type: 'hash' },
    { icon: Users, label: 'Team', to: '/members', type: 'link' },
    { icon: Phone, label: 'Contact Us', to: '/contact', type: 'link' },
  ];

  const serviceDropdownItems = [
    { label: 'Voice Over', to: '/voiceover' },
    { label: 'Cinematography', to: '/cinema-portfolio' },
    { label: 'Software Development', to: '/software-development' },
    { label: 'Digital Marketing', to: '/digital-marketing' },
  ];

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-slate-900/80 backdrop-blur-xl shadow-lg border-b border-slate-700 py-3' : 'bg-transparent py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            
            <Link to="/" className="flex-shrink-0">
              <img 
                src="https://ucpmarocgo.s3.us-east-1.amazonaws.com/logo-ucp-maroc.png" 
                alt="UCP Maroc Logo" 
                className="w-40 md:w-48 transition-transform duration-300 hover:scale-105" 
              />
            </Link>

            {/* --- Desktop Menu --- */}
            <div className="hidden lg:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Home</Link>
              
              {/* --- CORRECTED: Services Dropdown --- */}
              <div 
                className="relative" 
                onMouseEnter={() => setIsServicesOpen(true)}
                onMouseLeave={() => setIsServicesOpen(false)}
              >
                <button
                  className="flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Services <ChevronDown size={16} />
                </button>
                {isServicesOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden animate-in fade-in zoom-in-95">
                    {serviceDropdownItems.map(item => (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setIsServicesOpen(false)}
                        className="block px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/portfolio" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Gallery</Link>
              <HashLink to="/#packages" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Packages</HashLink>
              <Link to="/members" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Team</Link>
              <Link to="/contact" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Contact</Link>
            </div>

            <div className="flex items-center gap-4">
              {/* --- CORRECTED: Login Dropdown (Desktop) --- */}
              <div 
                className="hidden lg:block relative"
                onMouseEnter={() => setIsLoginOpen(true)}
                onMouseLeave={() => setIsLoginOpen(false)}
              >
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full hover:scale-105 transition-transform"
                >
                  <LogIn size={16} />
                  Login / Sign Up
                </button>
                {isLoginOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden animate-in fade-in zoom-in-95"
                  >
                    <Link to="/client-auth" onClick={() => setIsLoginOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">
                      <UserCircle size={16} className="text-purple-400" />
                      Client Portal
                    </Link>
                    <Link to="/actor-login" onClick={() => setIsLoginOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">
                      <UserCheck size={16} className="text-blue-400" />
                      Actor Portal
                    </Link>
                  </div>
                )}
              </div>

              {/* Hamburger Menu Button (Mobile) */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Mobile Slide-out Menu --- */}
      <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-slate-900/90 backdrop-blur-xl shadow-2xl transform transition-all duration-300 ease-out z-50 border-l border-slate-700 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h3 className="font-bold text-white">Menu</h3>
          <button onClick={closeMenu} className="p-2 rounded-lg text-white hover:bg-white/10">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
          <ul className="space-y-2 mb-8">
            {allMenuItems.map((item) => {
              const IconComponent = item.icon;
              const LinkComponent = item.type === 'hash' ? HashLink : Link;
              return (
                <li key={item.label}>
                  <LinkComponent
                    to={item.to}
                    onClick={closeMenu}
                    className="flex items-center gap-4 text-white p-3 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <IconComponent size={20} className="text-purple-400" />
                    <span className="font-medium">{item.label}</span>
                  </LinkComponent>
                </li>
              );
            })}
          </ul>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-400 uppercase">Portals</h4>
            <Link to="/client-auth" onClick={closeMenu} className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full hover:scale-105 transition-transform">
              <UserCircle size={18} />
              Client Login
            </Link>
            <Link to="/actor-login" onClick={closeMenu} className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-slate-700 text-white font-semibold rounded-full hover:bg-slate-600 transition-colors">
              <UserCheck size={18} />
              Talent Login
            </Link>
          </div>

          {/* --- RE-ADDED: Customized Package Button --- */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <Link
              to="/customized-package"
              onClick={closeMenu}
              className="w-full bg-white text-black font-semibold px-6 py-4 rounded-xl text-center block transition-all duration-300 hover:scale-105"
            >
              Customized Package
            </Link>
          </div>

        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeMenu} />
      )}
    </>
  );
};

export default Navbar;