import React from "react";
import { cn } from "@/lib/utils";
import { Linkedin, Instagram, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { UCP } from "@ucp/sdk"; // 🚀 Bring in the SDK

// 1. DEVELOPER SCHEMA
export const schema = [
  { id: "cardStyle", type: "select", label: "Card Style", options: ["elevated", "flat-bordered", "glass"], defaultValue: "elevated" },
  { id: "imageAspect", type: "select", label: "Image Aspect Ratio", options: ["square", "portrait"], defaultValue: "square" },
];

export default function CupertinoTeam({ data, settings = {}, id, isPreview }: any) {
  const members = data.members || [];
  const hasMembers = members.length > 0;
  const variant = data.variant || "grid";

  // 🚀 USE SDK CAROUSEL HOOK
  const { carouselRef, scrollCarousel } = UCP.useCarousel();

  if (!hasMembers && !isPreview) return null;

  // Theme styling logic
  const cardClass = settings.cardStyle === "flat-bordered" ? "bg-white border border-slate-200 shadow-sm hover:shadow-md"
                  : settings.cardStyle === "glass" ? "bg-white/40 backdrop-blur-xl border border-white shadow-lg hover:shadow-xl"
                  : "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-transparent";
                  
  const imgAspectClass = settings.imageAspect === "portrait" ? "aspect-[4/5]" : "aspect-square";

  // --- SUB-COMPONENT: MEMBER CARD ---
  const MemberCard = ({ member, isFeatured = false, className }: any) => (
    <div className={cn("group rounded-[2rem] overflow-hidden transition-all duration-500 flex flex-col", cardClass, className)}>
      {/* Image Block */}
      <div className={cn("relative w-full overflow-hidden bg-slate-100 shrink-0", imgAspectClass, isFeatured ? "md:aspect-[16/10]" : "")}>
        {member.image ? (
          <img src={member.image} alt={member.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Users className="w-12 h-12 text-slate-300" /></div>
        )}
      </div>

      {/* Content Block */}
      <div className="p-6 md:p-8 flex flex-col flex-grow bg-inherit">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{member.role || "Team Member"}</p>
        <h3 className={cn("font-[800] tracking-tight text-slate-900 mb-3", isFeatured ? "text-3xl md:text-4xl" : "text-xl md:text-2xl")}>
          {member.name || "Unnamed"}
        </h3>
        
        {member.bio && (
          <p className={cn("text-slate-500 font-medium leading-relaxed flex-grow", isFeatured ? "text-lg max-w-2xl" : "text-sm")}>
            {member.bio}
          </p>
        )}

        <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200/50">
          {member.linkedin && <a href={member.linkedin} target="_blank" rel="noreferrer" onClick={e => isPreview && e.preventDefault()} className="text-slate-400 hover:text-blue-600 transition-colors"><Linkedin size={20} /></a>}
          {member.instagram && <a href={member.instagram} target="_blank" rel="noreferrer" onClick={e => isPreview && e.preventDefault()} className="text-slate-400 hover:text-pink-600 transition-colors"><Instagram size={20} /></a>}
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-24 md:py-32 px-6 bg-slate-50 text-slate-900 relative">
      <div className="container mx-auto max-w-7xl">
        
        {/* HEADER */}
        <div className="mb-16 text-center max-w-3xl mx-auto space-y-4">
          {data.label && (
            <span className="text-xs font-bold tracking-widest uppercase text-slate-400 block mb-2">
              <UCP.Text field="label" value={data.label} sectionId={id} isPreview={isPreview} />
            </span>
          )}
          <UCP.Text as="h2" field="title" value={data.title || "Meet Our Team"} sectionId={id} isPreview={isPreview} className="text-4xl md:text-6xl font-[800] tracking-tighter text-slate-900" />
          <UCP.Text as="p" field="subheadline" value={data.subheadline || "The creative minds behind the magic."} sectionId={id} isPreview={isPreview} className="text-lg md:text-xl text-slate-500 font-medium" />
        </div>

        {/* GRID LAYOUTS */}
        {hasMembers && variant === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {members.map((member: any, idx: number) => <MemberCard key={idx} member={member} className="h-full" />)}
          </div>
        )}

        {hasMembers && variant === "spotlight" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2">
              <MemberCard member={members[0]} isFeatured={true} className="h-full" />
            </div>
            <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
              {members.slice(1, 3).map((member: any, idx: number) => <MemberCard key={idx} member={member} className="h-full" />)}
            </div>
            {members.length > 3 && (
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-2">
                {members.slice(3).map((member: any, idx: number) => <MemberCard key={idx} member={member} className="h-full" />)}
              </div>
            )}
          </div>
        )}

        {/* CAROUSEL LAYOUT */}
        {hasMembers && variant === "carousel" && (
          <div className="relative group/carousel -mx-6 px-6 md:mx-0 md:px-0">
            <button onClick={() => scrollCarousel("left")} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-white/90 hover:bg-white text-slate-900 rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 backdrop-blur-md shadow-lg border border-slate-200 hover:scale-105 hidden md:flex">
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button onClick={() => scrollCarousel("right")} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-white/90 hover:bg-white text-slate-900 rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 backdrop-blur-md shadow-lg border border-slate-200 hover:scale-105 hidden md:flex">
              <ChevronRight className="w-8 h-8" />
            </button>

            <div ref={carouselRef} className="flex overflow-x-auto pb-12 pt-4 gap-6 md:gap-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
              {members.map((member: any, idx: number) => (
                <div key={idx} className="snap-center shrink-0 w-[85vw] sm:w-[350px]">
                  <MemberCard member={member} className="h-full" />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

CupertinoTeam.schema = schema;