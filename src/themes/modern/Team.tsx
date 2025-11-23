import React from 'react';
import { BlockProps } from '../types';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Team: React.FC<BlockProps> = ({ data }) => {
  if (!data.members || data.members.length === 0) return null;

  return (
    <section className="py-24 px-4 bg-background">
        <div className="container max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">{data.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {data.members.map((member: any, i: number) => (
                    <div key={i} className="text-center group">
                        <div className="relative w-32 h-32 mx-auto mb-6">
                            <Avatar className="w-full h-full border-4 border-background shadow-xl group-hover:scale-105 transition-transform">
                                <AvatarImage src={member.image} className="object-cover" />
                                <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </div>
                        <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                        <p className="text-sm text-primary font-medium mb-3">{member.role}</p>
                        {member.bio && <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>}
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
};

export default Team;