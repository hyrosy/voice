import React, { useState, useEffect } from 'react';
import { Shield, Eye, Lock, Database, Globe, Mail, FileText, Clock, Phone, MapPin, Users, AlertCircle } from 'lucide-react';

const TermsandConditions = () => {
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

  const TermsandConditionsSections = [
    {
      icon: FileText,
      title: "1. General Information",
      content: `Welcome to UCPMAROC! These Terms and Conditions govern your use of our website and the services we provide. By engaging with our services, you agree to abide by these Terms and Conditions. If you do not agree with any part of these terms, please refrain from using our services.
      
      UCPMAROC is a digital agency specializing in website development, marketing, and business solutions. We are committed to providing high-quality, customized services that help our clients achieve their digital goals with maximum efficiency and creativity.
      
      These Terms and Conditions apply to all our services, including but not limited to:
      - Website Development
      - Digital Marketing
      - Subscription-Based Digital Solutions
      
      By using our services, you confirm that you have read and understood these terms.`
    },
    {
      icon: FileText,
      title: "2. Services",
      content: `We offer a wide range of services, including but not limited to:
      - Website design and development
      - Marketing strategies (digital, social media, content)
      - Business consultations
      - Branding and creative solutions
      - SEO services
      
      UCPMAROC will work closely with you to ensure that the services are tailored to your business needs and goals. You can learn more about our service offerings on our website or by contacting our customer service team.`
    },
    {
      icon: FileText,
      title: "3. Payments and Refunds",
      content: `3.1 Payment Structure
      To make our services more accessible, we offer flexible payment options:
      - Milestone Payments: Payments are broken down into specific stages, based on agreed-upon project deliverables. This allows you to pay as the project progresses, ensuring that you only pay for work that has been completed.
      - Subscription Payments: For ongoing services such as digital marketing or maintenance, we offer subscription-based payments, enabling clients to pay in manageable installments for continued service delivery over time.
      
      Both payment structures are designed to give clients flexibility, allowing them to "pay as they go" while maintaining full control over their resources.
      
      3.2 Use of Funds
      Your payments go directly toward:
      - Labor and Expertise: Covering the costs of skilled professionals who work on your project.
      - Resources and Tools: Funding the acquisition of any external tools or resources needed for the successful delivery of services.
      - Service Delivery: Ensuring that every stage of your project is executed with care and attention to detail.
      
      In some cases, we may request that clients purchase certain tools or services themselves. This keeps you in control of external costs while we focus on executing the core tasks related to your project.
      
      3.3 No Refund Policy
      Because our pricing is based on labor and resources already committed to your project, we do not offer refunds once work has started or costs have been incurred. This includes:
      - Strategy and planning
      - Resource allocation
      - Development or implementation work
      
      We do not charge advance payments for work that has not begun. Payments are due for services rendered, and we only charge for work already completed or in progress.
      
      However, client satisfaction is a priority for us. If there are concerns about the service delivered, please reach out to our support team. We are committed to working with you to find the best solution. Refunds will only be considered if no work has started, and no costs have been incurred.
      
      3.4 Disputes and Resolution
      If there is a dispute regarding payment or service delivery, please contact our support team immediately. We will work with you to resolve the issue in a fair and timely manner.`
    },
    {
      icon: FileText,
      title: "4. Client Responsibilities",
      content: `Clients are responsible for:
      - Providing necessary information: Ensuring all relevant details and access are provided for the efficient delivery of services.
      - Securing tools/resources: In some cases, clients may be asked to purchase tools or external services (e.g., domain registration, hosting) that are necessary for service delivery. These costs are separate from our labor costs.
      - Timely communication: Keeping us informed and responding to requests in a timely manner to avoid delays in service delivery.
      
      We are committed to transparency and collaboration, and we ask that clients engage actively in the process to ensure success.`
    },
    {
      icon: FileText,
      title: "5. Confidentiality",
      content: `UCPMAROC respects your privacy and will not share your confidential information without your consent. Any materials or data provided by you will only be used for the purpose of delivering services and fulfilling project goals.
      
      We also commit to keeping your proprietary business information confidential and will not disclose any private details to third parties unless explicitly authorized by you.`
    },
    {
      icon: FileText,
      title: "6. Intellectual Property",
      content: `All materials created during the course of service delivery (e.g., designs, content, websites, marketing strategies) are the intellectual property of UCPMAROC unless otherwise agreed upon in writing.
      
      You may request exclusive rights or licenses for specific materials by negotiating terms with us. In cases where you request ownership or exclusivity, this will be clearly outlined in a separate agreement.`
    },
    {
      icon: FileText,
      title: "7. Termination",
      content: `Both UCPMAROC and the client have the right to terminate services at any time, with prior notice. In the event of termination:
      - Clients will be charged for work completed up to the termination date.
      - No further payments will be required for unfinished work.
      
      Termination does not affect any rights or obligations accrued prior to termination.`
    },
    {
      icon: FileText,
      title: "8. Limitation of Liability",
      content: `UCPMAROC is not responsible for indirect, incidental, or consequential damages arising from the use of our services. While we strive to provide the highest quality of service, we are not liable for issues beyond our control (e.g., third-party services, tools, or platforms).`
    },
    {
      icon: FileText,
      title: "9. Privacy and Data Protection",
      content: `We take data protection seriously. Our privacy policy outlines how we collect, use, and store personal data. We will only use your data for the purposes of providing the services you request, and we will not sell or rent your personal information to third parties.
      
      For more information on how we protect your personal data, please refer to our [Privacy Policy].`
    },
    {
      icon: FileText,
      title: "10. Governing Law",
      content: `These Terms and Conditions shall be governed by the laws of United States. Any disputes arising from these terms will be resolved in the appropriate courts located in Marrakech, United States.`
    },
    {
      icon: FileText,
      title: "11. Changes to Terms and Conditions",
      content: `UCPMAROC reserves the right to modify these Terms and Conditions at any time. We will notify clients of any significant changes through email or by updating this document on our website. The latest version of these Terms will always be available on our site.`
    },
    {
      icon: FileText,
      title: "12. Contact Information",
      content: `If you have any questions or concerns about these Terms and Conditions, please contact us at:
      +1 (209) 442-6729 / Support@ucpmaroc.com for any inquiries.`
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
              Terms of <span className="font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Service</span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto mb-4">
              These Terms of Service describe how UCPMAROC offers this website, including all information, tools and Services available from this site to you.
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
                <h3 className="text-lg font-semibold text-white mb-2">Important Notice</h3>
                <p className="text-gray-300 leading-relaxed">
                  By visiting our site and/ or purchasing something from us, you engage in our “Service” and agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions of this agreement, then you may not access the website or use any Services.
                </p>
              </div>
            </div>
          </div>

          {/* Terms of Service Sections */}
          <div className="grid lg:grid-cols-1 gap-8 mb-16">
            {TermsandConditionsSections.map((section, index) => (
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
            <h2 className="text-xl font-semibold text-white mb-4">Changes to These Terms of Service</h2>
            <p className="text-gray-300 leading-relaxed">
              You can review the most current version of the Terms of Service at any time on this page. We reserve the right to update, change or replace any part of these Terms of Service by posting updates and/or changes to our website. It is your responsibility to check this page periodically for changes. Your continued use of or access to the website following the posting of any changes constitutes acceptance of those changes.
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

export default TermsandConditions;