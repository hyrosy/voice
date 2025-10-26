import React, { useState, useEffect } from 'react';
import { Shield, Eye, Lock, Database, Globe, Mail, FileText, Clock, Phone, MapPin, Users, AlertCircle } from 'lucide-react';

const PrivacyPolicyPage = () => {
  // Animated particles for background
  interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
  }
  
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 30; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
        });
      }
      setParticles(newParticles);
    };

    generateParticles();

    const animateParticles = () => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          x: (particle.x + particle.speedX + 100) % 100,
          y: (particle.y + particle.speedY + 100) % 100,
        }))
      );
    };

    const interval = setInterval(animateParticles, 100);
    return () => clearInterval(interval);
  }, []);

  const privacySections = [
  {
    icon: FileText,
    title: "Information We Collect",
    content: `The types of personal information we obtain about you depend on how you interact with our Site and use our Services. When we use the term "personal information", we are referring to information that identifies, relates to, describes or can be associated with you.

Information We Collect Directly from You:
- Basic contact details including your name, address, phone number, email.
- Order information including your name, billing address, shipping address, payment confirmation, email address, phone number.
- Account information including your username, password, security questions.
- Shopping information including the items you view, put in your cart or add to your wishlist.
- Customer support information including the information you choose to include in communications with us.

Some features of the Services may require you to directly provide us with certain information about yourself. You may elect not to provide this information, but doing so may prevent you from using or accessing these features.`
  },
  {
    icon: Database,
    title: "Information Collection Methods",
    content: `We collect personal information through the following methods:

- Directly from you when you use our Services.
- Automatically through cookies and usage data, including device information, browser information, IP address, and network activity.
- From third parties, including:
  - Companies who support our Site and Services, such as WordPress.
  - Payment processors who collect payment information to fulfill your orders.
  - Third-party analytics and advertising tools using pixels, cookies, and SDKs.

We treat all third-party data in accordance with this Privacy Policy.`
  },
  {
    icon: Eye,
    title: "How We Use Your Information",
    content: `We use your personal information to:

- Provide products and services, including order processing, account management, shipping, returns, and customer service.
- Perform marketing and advertising, such as sending promotional messages and delivering targeted ads.
- Ensure security and prevent fraud, such as detecting suspicious activities and maintaining account protection.
- Communicate with you, including responding to customer service requests and feedback.

In addition, we may use the data to comply with legal obligations, enforce terms, and protect the Services and users.`
  },
  {
    icon: Globe,
    title: "Cookies and Tracking",
    content: `We use cookies and similar tracking technologies to enhance your experience on ucpmaroc.com.

Types of Cookies We Use:
- Essential Cookies – Required for core functionalities (e.g., login, cart).
- Performance Cookies – Help analyze site performance and visitor behavior.
- Functional Cookies – Remember user preferences (e.g., language).
- Analytics Cookies – Used to improve structure and content (e.g., Google Analytics).
- Advertising Cookies – Used by third parties to show relevant ads based on your behavior.

Third-Party Cookies:
Some are set by third parties (e.g., Shopify, Google, social media platforms) and may track activity across sites.

Your Choices:
You can manage cookies through your browser to:
- View, delete, or block cookies.
- Set site-specific preferences.

Disabling some cookies may affect functionality.

More info:
- www.allaboutcookies.org
- www.youronlinechoices.com`
  },
  {
    icon: Lock,
    title: "Information Sharing",
    content: `We may share your data with:

- Vendors and service providers (e.g., Shopify, hosting, payment processors).
- Marketing and business partners.
- Affiliates or in connection with a business restructure.
- Legal authorities when required by law.

Categories Disclosed in the Past 12 Months:
- Identifiers (e.g., name, email): Vendors, Affiliates, Partners
- Commercial info (e.g., purchases): Shopify, Fulfillment
- Internet/Network data (e.g., usage): Analytics & Ad Providers

We do not sell or share sensitive personal data for profiling.`
  },
  {
    icon: Shield,
    title: "Your Rights",
    content: `Depending on your jurisdiction, you may have the following rights:

- Access / Know: See what data we hold on you.
- Delete: Ask us to erase your data.
- Correct: Request corrections to inaccurate data.
- Portability: Receive a copy of your data.
- Restrict Processing: Limit how we use your data.
- Withdraw Consent: Revoke your consent at any time.
- Appeal: Challenge our decisions regarding your data.
- Opt Out: Unsubscribe from promotional emails.

We may verify your identity before fulfilling requests. You may also authorize someone to act on your behalf.`
  }
];


  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      description: "+1 (209) 442-6729"
    },
    {
      icon: Mail,
      title: "Email",
      description: "support@ucpmaroc.com"
    },
    {
      icon: MapPin,
      title: "US Address",
      description: "HYROSY LLC, 30 N Gould St Ste R Sheridan, WY 82801, United States"
    },
    {
      icon: MapPin,
      title: "Morocco Address", 
      description: "C M UNITE 4 N 899, MARRAKECH 40000, Morocco"
    },
    {
      icon: Clock,
      title: "Last Updated",
      description: "April 16, 2025"
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-4000"></div>
        
        {/* Floating Particles */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute bg-white rounded-full opacity-20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              transition: 'all 0.1s linear',
            }}
          />
        ))}
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen py-12 px-6">
        <div className="w-full max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-16 py-10">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl mb-6">
              <Shield className="w-12 h-12 text-purple-300" />
            </div>
            <h1 className="text-5xl lg:text-6xl font-light text-white leading-tight mb-6">
              Privacy <span className="font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Policy</span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto mb-4">
              This Privacy Policy describes how ucpmaroc.com collects, uses, and discloses your personal information when you visit, use our services, or make a purchase from our site.
            </p>
            <p className="text-lg text-gray-400">
              UCPMAROC is operated by HYROSY LLC, a limited liability company registered in the United States.
            </p>
          </div>

          {/* Important Notice */}
          <div className="backdrop-blur-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-3xl p-8 border border-yellow-400/20 shadow-2xl mb-12">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-2 bg-yellow-500/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Important</h3>
                <p className="text-gray-300 leading-relaxed">
                  By using and accessing any of our Services, you agree to the collection, use, and disclosure of your information as described in this Privacy Policy. If you do not agree to this Privacy Policy, please do not use or access any of our Services.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Sections */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {privacySections.map((section, index) => (
              <div key={index} className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300 group">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="flex-shrink-0 p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-300">
                    <section.icon className="w-6 h-6 text-purple-300" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                </div>
                <p className="text-gray-300 leading-relaxed pl-14">{section.content}</p>
              </div>
            ))}
          </div>

          {/* Additional Important Information */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 lg:p-12 border border-white/20 shadow-2xl mb-12">
            <h2 className="text-2xl font-semibold text-white mb-8">Additional Important Information</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-purple-300" />
                    User Generated Content
                  </h3>
                  <p className="text-gray-300 leading-relaxed">Anything you post publicly (like reviews) is visible to others. Use discretion when sharing personal details in public forums.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-purple-300" />
                    Children's Data
                  </h3>
                  <p className="text-gray-300 leading-relaxed">Our Services are not intended for children under 16. We do not knowingly collect data from them. If you believe we have, contact us to delete it.</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-3 flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-purple-300" />
                    International Users
                  </h3>
                  <p className="text-gray-300 leading-relaxed">We may store and process your data outside of your home country, including in the U.S. If data is transferred from the EU or UK, we use Standard Contractual Clauses.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-3 flex items-center">
                    <Lock className="w-5 h-5 mr-2 text-purple-300" />
                    Security & Retention
                  </h3>
                  <p className="text-gray-300 leading-relaxed">We use reasonable security measures but cannot guarantee 100% security. Data retention depends on service needs, legal requirements, and your requests.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Categories Table */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 lg:p-12 border border-white/20 shadow-2xl mb-12">
            <h2 className="text-2xl font-semibold text-white mb-6">Categories Disclosed in the Past 12 Months</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 text-white font-medium">Category</th>
                    <th className="text-left py-3 px-4 text-white font-medium">Recipients</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Identifiers (e.g., name, email)</td>
                    <td className="py-3 px-4">Vendors, Affiliates, Partners</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Commercial info (e.g., purchases)</td>
                    <td className="py-3 px-4">Shopify, Fulfillment</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Internet/Network data (e.g., usage)</td>
                    <td className="py-3 px-4">Analytics & Ad Providers</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-400 mt-4">We do not sell or share sensitive personal data for profiling.</p>
          </div>

          {/* Contact Information */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {contactInfo.map((info, index) => (
              <div key={index} className="backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-300">
                    <info.icon className="w-5 h-5 text-purple-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1">{info.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed break-words">{info.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Policy Changes Notice */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl mb-12">
            <h2 className="text-xl font-semibold text-white mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time, including to reflect changes to our practices or for other operational, legal, or regulatory reasons. We will post the revised Privacy Policy on the Site, update the "Last updated" date and take any other steps required by applicable law.
            </p>
          </div>

          {/* Company Information */}
          <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-8 border border-white/10">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold text-white">UCPMAROC</h3>
              <p className="text-gray-300">Operated by HYROSY LLC</p>
              <p className="text-sm text-gray-400">Limited liability company registered in the United States</p>
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400">
                  HYROSY LLC, © 2025. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default PrivacyPolicyPage;