import React from 'react';
import { BlockProps } from '../types';

const Map: React.FC<BlockProps> = ({ data }) => {
  if (!data.mapUrl) return null;
  
  // Helper to ensure valid Embed URL
  let embedSrc = data.mapUrl;
  // If user pasted a full iframe tag, extract src (rudimentary)
  if (embedSrc.includes('<iframe')) {
      const match = embedSrc.match(/src="([^"]+)"/);
      if (match) embedSrc = match[1];
  }

  return (
    <section className="py-0 w-full">
        {data.title && <h2 className="sr-only">{data.title}</h2>}
        <div className={`w-full grayscale hover:grayscale-0 transition-all duration-500 ${data.height === 'large' ? 'h-[600px]' : 'h-[400px]'}`}>
            <iframe 
                src={embedSrc} 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
            />
        </div>
    </section>
  );
};

export default Map;