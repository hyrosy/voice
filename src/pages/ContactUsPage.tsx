import React, { useState } from 'react';
import { Mail, Phone, MapPin, Building2, CreditCard, Shield, Send } from 'lucide-react';
import emailjs from '@emailjs/browser';

// --- Main Page Component ---
const ContactUsPage = () => {

  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Sending...');

    // Replace with your actual EmailJS Service ID, Template ID, and Public Key
    emailjs.send(
      'YOUR_SERVICE_ID', 
      'YOUR_TEMPLATE_ID', 
      {
        from_name: `${formState.firstName} ${formState.lastName}`,
        to_name: "UCPMAROC Admin",
        from_email: formState.email,
        message: formState.message,
      }, 
      'YOUR_PUBLIC_KEY'
    ).then((result) => {
        console.log(result.text);
        setStatus('Message Sent Successfully!');
        setFormState({ firstName: '', lastName: '', email: '', message: '' }); // Clear form
    }, (error) => {
        console.log(error.text);
        setStatus('Failed to send message. Please try again.');
    });
  };

  const companyInfo = [
    {
      icon: Building2,
      title: "Company",
      description: "UCPMAROC is operated by HYROSY LLC"
    },
    {
      icon: MapPin,
      title: "Address",
      description: "30 N Gould St Ste R Sheridan, WY 82801, United States"
    },
    {
      icon: Shield,
      title: "Registration",
      description: "Limited liability company registered in the United States"
    },
    {
      icon: CreditCard,
      title: "Payments",
      description: "All payments are securely processed by HYROSY LLC"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="container mx-auto px-4 py-16 md:py-24">
        
        {/* Main Grid Layout */}
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Info */}
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                Get in <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Touch</span>
              </h1>
              <p className="text-md text-slate-400 max-w-lg">
                Ready to start your journey? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
            </div>

            {/* Company Info Cards */}
            <div className="space-y-3">
              {companyInfo.map((info, index) => (
                <div key={index} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex items-center space-x-4">
                  <div className="flex-shrink-0 p-3 bg-slate-700 rounded-lg">
                    <info.icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{info.title}</h3>
                    <p className="text-slate-400 text-sm">{info.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
             <h2 className="text-2xl font-bold mb-6 text-white">Send a Message</h2>
             <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
                        <input type="text" name="firstName" id="firstName" value={formState.firstName} onChange={handleInputChange} required className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-purple-500 focus:border-purple-500"/>
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
                        <input type="text" name="lastName" id="lastName" value={formState.lastName} onChange={handleInputChange} required className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-purple-500 focus:border-purple-500"/>
                    </div>
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                    <input type="email" name="email" id="email" value={formState.email} onChange={handleInputChange} required className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-purple-500 focus:border-purple-500"/>
                </div>
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                    <textarea name="message" id="message" rows={4} value={formState.message} onChange={handleInputChange} required className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-purple-500 focus:border-purple-500"></textarea>
                </div>
                <div>
                    <button type="submit" disabled={status === 'Sending...'} className="w-full group flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        {status === 'Sending...' ? 'Sending...' : 'Send Message'}
                        <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
             </form>
             {status && <p className={`mt-4 text-center text-sm ${status.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>{status}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;

