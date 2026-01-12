import React from 'react';
import { cn } from "@/lib/utils";

export const schema = [
  { id: 'rounded', type: 'slider', min: 0, max: 40, label: 'Corner Roundness', defaultValue: 24 }
];

export const Gallery = ({ data, settings = {} }: any) => {
  const images = data.images || [];
  const radius = settings.rounded || 24;

  return (
    <section className="py-32 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="mb-16">
           <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">{data.title}</h2>
           <div className="h-1 w-20 bg-blue-600 rounded-full" />
        </div>

        {/* BENTO GRID CSS */}
        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[300px] gap-6">
          {images.map((img: any, idx: number) => {
            // Logic: Make every 4th item span 2 columns and 2 rows (Big Square)
            // Make every 7th item span 2 columns (Wide Rectangle)
            const isLarge = idx === 0 || idx % 7 === 0;
            const isTall = idx === 2 || idx % 5 === 0;
            
            let colSpan = "col-span-1";
            let rowSpan = "row-span-1";
            
            if (isLarge) { colSpan = "md:col-span-2"; rowSpan = "md:row-span-2"; }
            else if (isTall) { rowSpan = "md:row-span-2"; }

            return (
              <div 
                key={idx} 
                className={cn(
                  "relative group overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-500 ease-out hover:-translate-y-1",
                  colSpan, 
                  rowSpan
                )}
                style={{ borderRadius: radius }} // Dynamic Radius
              >
                <img 
                  src={img.url} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Overlay Text (Only on Hover) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                   <p className="text-white font-medium translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      {img.caption || "View Project"}
                   </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

(Gallery as any).schema = schema;