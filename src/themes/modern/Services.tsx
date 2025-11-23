import React from 'react';
import { BlockProps } from '../types';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from 'lucide-react';

const Services: React.FC<BlockProps> = ({ data }) => {
  const services = ['Voice Over', 'Scriptwriting', 'Video Editing']; // Ideally fetch these from actorId later

  return (
    <section className="py-24 px-4 bg-background">
        <div className="container max-w-5xl mx-auto">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-bold mb-4">{data.title}</h2>
               <p className="text-muted-foreground">Professional services tailored to your needs.</p>
            </div>

            {data.displayMode === 'list' ? (
               // LIST MODE
               <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto">
                  {services.map(service => (
                     <div key={service} className="flex items-center justify-between p-6 bg-muted/30 rounded-xl border hover:border-primary transition-colors">
                        <div className="flex items-center gap-4">
                           <CheckCircle className="w-6 h-6 text-primary" />
                           <h3 className="font-bold text-xl">{service}</h3>
                        </div>
                        {data.showRates && <span className="text-sm font-semibold text-muted-foreground">From 500 MAD</span>}
                     </div>
                  ))}
               </div>
            ) : (
               // CARD MODE (Default)
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {services.map(service => (
                   <Card key={service} className="border-2 hover:border-primary transition-all hover:-translate-y-1">
                      <CardContent className="p-8 pt-10 text-center">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                             <CheckCircle className="w-8 h-8" />
                          </div>
                          <h3 className="font-bold text-2xl mb-2">{service}</h3>
                          <p className="text-muted-foreground mb-6">Professional quality delivery.</p>
                          {data.showRates && <p className="text-sm font-semibold text-primary">Rates available upon request</p>}
                      </CardContent>
                   </Card>
                 ))}
               </div>
            )}
        </div>
    </section>
  );
};

export default Services;