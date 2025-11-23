import React from 'react';
import { BlockProps } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const PricingCard = ({ plan }: { plan: any }) => (
    <Card className="h-full flex flex-col border-2 hover:border-primary transition-colors relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-600" />
        <CardHeader className="text-center pb-2">
            <h3 className="text-lg font-medium text-muted-foreground uppercase tracking-wider">{plan.name}</h3>
            <div className="flex justify-center items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">/ project</span>
            </div>
        </CardHeader>
        <CardContent className="flex-grow pt-6">
            <ul className="space-y-3">
                {plan.features?.split(',').map((feat: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{feat.trim()}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
        <CardFooter>
            <Button className="w-full rounded-full" variant="outline">{plan.cta || "Choose Plan"}</Button>
        </CardFooter>
    </Card>
);

const Pricing: React.FC<BlockProps> = ({ data }) => {
  if (!data.plans || data.plans.length === 0) return null;

  return (
    <section className="py-24 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">{data.title}</h2>
            
            {data.layout === 'slider' ? (
                <div className="px-12">
                    <Carousel opts={{ align: "start", loop: false }} className="w-full">
                        <CarouselContent>
                            {data.plans.map((plan: any, i: number) => (
                                <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3 pl-6">
                                    <PricingCard plan={plan} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {data.plans.map((plan: any, i: number) => (
                        <PricingCard key={i} plan={plan} />
                    ))}
                </div>
            )}
        </div>
    </section>
  );
};

export default Pricing;