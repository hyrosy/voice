import React from 'react';
import { ArrowRight, Award, PlayCircle, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-900">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.2),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.2),transparent_40%)] animate-pulse animation-delay-2000" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen">
          
          {/* Content Section */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-slate-300">
              <Sparkles size={16} className="text-yellow-400" />
              <span className="text-sm font-medium">AI-Powered Digital Marketing</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-white">
              You're Watching<br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Success
              </span> in Motion
            </h1>
            
            <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
              UCPMAROC leverages cutting-edge AI to create automated marketing campaigns and stunning websites that generate revenue 24/7. Our proven strategies deliver exceptional results.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/contact" className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 inline-flex items-center justify-center">
                <div className="relative flex items-center gap-2">
                  <span>Start a Project</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </Link>
              
              <Link to="/digital-marketing" className="group px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-full transition-all duration-300 hover:bg-white/20 hover:scale-105 inline-flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Award size={20} className="group-hover:rotate-12 transition-transform duration-300" />
                  <span>Our Services</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Video Section */}
          <div className="relative">
            <div className="relative group">
              <div className="relative rounded-3xl overflow-hidden bg-slate-800/50 border border-slate-700 p-2 shadow-2xl">
                <video
                  src="https://ucpmarocgo.s3.us-east-1.amazonaws.com/Demo.mp4"
                  poster="https://ucpmarocgo.s3.us-east-1.amazonaws.com/ucpmaroc-talents-message-video.png"
                  className="w-full aspect-video rounded-2xl object-cover"
                  controls
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
