import React from "react";
import { cn } from "@/lib/utils";
import { UCP } from "@ucp/sdk"; // 🚀 Import the Platform SDK

// 1. SCHEMA: Added the Title string so it shows in the platform editor
export const schema = [
  {
    id: "title",
    type: "string",
    label: "Section Title",
    defaultValue: "Featured Projects",
  },
  {
    id: "rounded",
    type: "slider",
    min: 0,
    max: 40,
    label: "Corner Roundness",
    defaultValue: 24,
  },
];

// 2. COMPONENT: Grabbing id and isPreview for the UCP SDK
export default function Gallery({ data, id, isPreview }: any) {
  // 🚀 3. FALLBACK DATA: Gorgeous default images so the Studio Preview isn't empty!
  const images =
    data.images?.length > 0
      ? data.images
      : [
          {
            url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
            caption: "Minimalist Workspace",
          },
          {
            url: "https://images.unsplash.com/photo-1616499370260-485b3e5ed653?q=80&w=2670&auto=format&fit=crop",
            caption: "Interior Design",
          },
          {
            url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2670&auto=format&fit=crop",
            caption: "Modern Architecture",
          },
          {
            url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2669&auto=format&fit=crop",
            caption: "Cozy Living Room",
          },
          {
            url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2758&auto=format&fit=crop",
            caption: "Furniture Design",
          },
        ];

  // Map the schema variable safely
  const radius = data.rounded !== undefined ? data.rounded : 24;

  return (
    <section className="py-32 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="mb-16">
          {/* 🚀 4. INLINE EDITING: The Title is now editable on the canvas! */}
          <UCP.Text
            as="h2"
            field="title"
            default="Featured Projects"
            sectionId={id}
            isPreview={isPreview}
            className="text-4xl font-bold tracking-tight text-slate-900 mb-4 inline-block"
          />
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

            if (isLarge) {
              colSpan = "md:col-span-2";
              rowSpan = "md:row-span-2";
            } else if (isTall) {
              rowSpan = "md:row-span-2";
            }

            return (
              <div
                key={idx}
                className={cn(
                  "relative group overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-500 ease-out hover:-translate-y-1",
                  colSpan,
                  rowSpan
                )}
                style={{ borderRadius: `${radius}px` }} // 🚀 Dynamic Radius mapping to px
              >
                <img
                  src={img.url}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt={img.caption || "Gallery Image"}
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
}

// Attach the schema
Gallery.schema = schema;
