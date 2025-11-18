import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { cn } from "@/lib/utils";

const quotes = [
  {
    arabic: "وَاعْمَلُوا عَمَلًا صَالِحًا إِنَي بِمَا تَعْمَلُونَ عَلِيمٌ",
    english: "And do good deeds; indeed, I am All-Seer of what you do.",
    reference: ""
  },
  {
    arabic: "وَمَا تَوْفِيقِي إِلَّا بِاللهِ عَلَيْهِ تَوَكلتُ وَإِلَيْهِ أَنِيبُ",
    english: "And my success is not but through Allah. Upon Him I have relied, and to Him I return.",
    reference: "(Hud: 88)"
  },
  {
    arabic: "إِن يُرِيدَا إِصْلَاحًا يُوَفَقِ اللَّهُ بَيْنَهُمَا",
    english: "If they both desire reconciliation, Allah will cause it between them.",
    reference: "(An-Nisa: 35)"
  },
  {
    arabic: "يَا أَيُّهَا النَّاسُ إِنَا خَلَقْنَاكُم مِن ذَكَرِ وَأنثى وَجَعَلْنَاكُمْ شُعُوبًا وَقَبَائِلَ لِتَعَارَفُوا إِنَّ أَكْرَمَكُمْ عِنْدَ اللَّهِ أَتْقَاكُمْ",
    english: "O mankind, We have created you from male and female and made you peoples and tribes that you may know one another. Indeed, the most noble of you in the sight of Allah is the most righteous of you.",
    reference: "(Al-Hujurat: 13)"
  },
  {
    arabic: "وَفِي السَّمَاءِ رِزْقُكُمْ وَمَا تُوعَدُونَ * فَوَرَبِّ السَّمَاءِ وَالْأَرْضِ إِنَّهُ لَحَقَّ مِثْلَ مَا أَنَّكُمْ تَنْطِقُونَ",
    english: "And in the heaven is your provision and whatever you are promised. Then by the Lord of the heaven and earth, indeed, it is truth - just as [surely as] you speak.",
    reference: "(Adh-Dhariyat: 22-23)"
  },
  {
    arabic: "إِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ الْمُتِينُ",
    english: "Indeed, it is Allah who is the [continual] Provider, the firm possessor of strength.",
    reference: "(Adh-Dhariyat: 58)"
  },
  {
    arabic: "اللَّهُ يَبْسُطُ الرِّزْقَ لِمَن يَشَاءُ وَيَقْدِرُ",
    english: "Allah extends provision for whom He wills and restricts [it].",
    reference: "(Ar-Ra'd: 26)"
  },
  {
    arabic: "وَمَا مِنْ دَابَّةٍ فِي الأَرْضِ إِلا عَلَى اللَّهِ رِزْقُهَا",
    english: "And there is no creature on earth but that upon Allah is its provision.",
    reference: "(Hud: 6)"
  }
];

// --- Background Images ---
const backgroundImages = [
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2094&auto=format&fit=crop", // Starry Sky
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2074&auto=format&fit=crop", // Nature/Fog
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop", // Mountains/River
  "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2013&auto=format&fit=crop", // Galaxy
];

const QuotesCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bgIndex, setBgIndex] = useState(0); // Track background index
  const [isHovered, setIsHovered] = useState(false);

  // Auto-scroll Quotes
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length);
    }, 8000); 
    return () => clearInterval(interval);
  }, [isHovered]);

  // Auto-scroll Backgrounds (slower than quotes for a nice parallax feel)
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 12000); // Change background every 12 seconds
    return () => clearInterval(interval);
  }, []);

  const nextQuote = () => {
    setCurrentIndex((prev) => (prev + 1) % quotes.length);
  };

  const prevQuote = () => {
    setCurrentIndex((prev) => (prev - 1 + quotes.length) % quotes.length);
  };

  return (
    <section className="relative py-32 md:py-40 overflow-hidden border-y border-border/50">
      
      {/* --- Background Image Loop --- */}
      {backgroundImages.map((img, index) => (
        <div
          key={img}
          className={cn(
            "absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out",
            index === bgIndex ? "opacity-100" : "opacity-0"
          )}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}

      {/* --- Dark Overlay --- */}
      <div className="absolute inset-0 bg-black/70 z-10" />

      {/* --- Content --- */}
      <div className="container relative z-20 max-w-4xl mx-auto px-4">
        <div 
          className="relative flex flex-col items-center text-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Quote className="w-12 h-12 text-white/80 mb-8 rotate-180" />
          
          <div className="min-h-[200px] flex flex-col justify-center items-center transition-all duration-500 ease-in-out">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-relaxed dir-rtl font-arabic drop-shadow-lg">
              "{quotes[currentIndex].arabic}"
            </h3>
            <p className="text-xl text-white/90 italic max-w-2xl font-light drop-shadow-md">
              "{quotes[currentIndex].english}"
            </p>
            {quotes[currentIndex].reference && (
              <span className="mt-6 text-sm font-semibold text-primary-foreground/80 uppercase tracking-widest">
                {quotes[currentIndex].reference}
              </span>
            )}
          </div>

          {/* Navigation Dots */}
          <div className="flex gap-3 mt-12">
            {quotes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 shadow-sm",
                  idx === currentIndex ? "bg-white w-8" : "bg-white/30 w-2 hover:bg-white/60"
                )}
                aria-label={`Go to quote ${idx + 1}`}
              />
            ))}
          </div>

          {/* Arrows */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:flex text-white/50 hover:text-white hover:bg-white/10 rounded-full h-12 w-12"
            onClick={prevQuote}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex text-white/50 hover:text-white hover:bg-white/10 rounded-full h-12 w-12"
            onClick={nextQuote}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default QuotesCarousel;