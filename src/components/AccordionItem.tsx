// In src/components/AccordionItem.tsx

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AccordionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionProps> = ({ title, icon, isOpen, onToggle, children }) => {
  return (
    <div className="bg-card/50 rounded-lg border border/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="text-purple-400">{icon}</div>
          <span className="font-bold text-foreground text-lg">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="text-muted-foreground" /> : <ChevronDown className="text-muted-foreground" />}
      </button>
      {isOpen && (
        <div className="p-4 border-t">
          {children}
        </div>
      )}
    </div>
  );
};

export default AccordionItem;