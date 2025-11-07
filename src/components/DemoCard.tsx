import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// This interface matches our SQL function
export interface Demo {
  demo_type: 'audio' | 'video' | 'script';
  demo_id: string;
  demo_title: string;
  demo_url: string | null;
  demo_content: string | null;
  created_at: string;
  actor_id: string;
  actor_name: string;
  actor_slug: string;
  actor_headshot: string;
}

interface DemoCardProps {
  demo: Demo;
}

const DemoCard: React.FC<DemoCardProps> = ({ demo }) => {

  const getBadgeVariant = (): "default" | "destructive" | "secondary" => {
    switch (demo.demo_type) {
      case 'audio':
        return 'default'; // default is purple
      case 'video':
        return 'destructive'; // destructive is red
      case 'script':
        return 'secondary'; // secondary is gray
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary/50">
      
      {/* --- 1. NEW CARD HEADER --- */}
      <CardHeader className="p-4">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-2">{demo.demo_title}</CardTitle>
          <Badge variant={getBadgeVariant()} className="flex-shrink-0 capitalize">
            {demo.demo_type}
          </Badge>
        </div>
      </CardHeader>
      
      {/* --- 2. ENHANCED CARD CONTENT --- */}
      <CardContent className="p-4 pt-0">
        {demo.demo_type === 'audio' && demo.demo_url && (
          // The dark:invert class is in your index.css and fixes the player in dark mode
          <audio controls src={demo.demo_url} className="w-full h-10" />
        )}
        
        {demo.demo_type === 'video' && demo.demo_url && (
          <video 
            controls 
            src={demo.demo_url} 
            className="w-full rounded-md aspect-video bg-black" 
          />
        )}
        
        {demo.demo_type === 'script' && demo.demo_content && (
          <div className="h-40 p-3 bg-muted rounded-md overflow-y-auto border custom-scrollbar">
            <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">
              "{demo.demo_content}"
            </p>
          </div>
        )}
      </CardContent>

      {/* --- 3. CLEANED CARD FOOTER --- */}
      <CardFooter className="p-4 pt-0 mt-auto border-t bg-accent/50">
        <Link to={`/actor/${demo.actor_slug}`} className="flex items-center gap-3 group w-full">
          <Avatar className="w-10 h-10 border-2 border-transparent group-hover:border-primary/50 transition-colors">
            <AvatarImage src={demo.actor_headshot} alt={demo.actor_name} />
            <AvatarFallback>{demo.actor_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm text-muted-foreground">Actor</p>
            <p className="text-sm text-foreground group-hover:text-primary transition-colors">
              {demo.actor_name}
            </p>
          </div>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default DemoCard;