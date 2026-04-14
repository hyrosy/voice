import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BookOpen } from "lucide-react";

interface SdkDocsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SdkDocsModal({
  isOpen,
  onOpenChange,
}: SdkDocsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-zinc-950 text-zinc-50 border-zinc-800 p-0 overflow-hidden rounded-2xl">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
          <DialogTitle className="text-2xl font-black text-white flex items-center gap-2">
            <BookOpen className="text-indigo-400" /> Theme Developer SDK
          </DialogTitle>
          <DialogDescription className="text-zinc-400 mt-2">
            Welcome to the Walled Garden. To ensure blazing fast load times and
            maximum security for our users, the Actor Pro Studio runs on a
            curated environment.
          </DialogDescription>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-8">
          {/* Styling */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">
              1. Styling & CSS
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Tailwind CSS is natively supported. You do not need to write
              custom CSS files. Use standard Tailwind classes on all elements.
            </p>
            <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-sm font-mono text-zinc-400">
              {`<div className="flex items-center bg-indigo-500 text-white p-4">...</div>`}
            </div>
          </section>

          {/* Imports */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">
              2. Approved Imports
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              You cannot import random packages from NPM. However, the following
              industry-standard libraries are securely pre-loaded for you:
            </p>
            <ul className="space-y-2">
              <li className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-sm font-mono text-indigo-300">
                import React, {"{ useState }"} from 'react';
              </li>
              <li className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-sm font-mono text-indigo-300">
                import {"{ motion }"} from "framer-motion";
              </li>
              <li className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-sm font-mono text-indigo-300">
                import {"{ ArrowRight, Star }"} from "lucide-react";
              </li>
              <li className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-sm font-mono text-emerald-400">
                {`// The Tailwind Merge utility:`}
                <br />
                import {"{ cn }"} from "@/lib/utils";
              </li>
            </ul>
          </section>

          {/* Schemas */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">
              3. Building the User Interface (Schemas)
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              To allow users to edit your theme without writing code, you must
              attach a <code>schema</code> array to your component. The platform
              will automatically build the UI settings panel.
            </p>
            <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-sm font-mono text-zinc-400 whitespace-pre-wrap">
              {`export default function MyHero({ data }) {
  return <h1 style={{ color: data.textColor }}>{data.title}</h1>;
}

MyHero.schema = [
  { id: 'title', type: 'string', label: 'Hero Title', defaultValue: 'Hello' },
  { id: 'textColor', type: 'color', label: 'Text Color', defaultValue: '#000' },
  { id: 'align', type: 'select', label: 'Alignment', options: ['left', 'center'], defaultValue: 'center' },
  { id: 'showGradient', type: 'toggle', label: 'Show Gradient', defaultValue: true }
];`}
            </div>
            <p className="text-sm text-zinc-400 mt-2">
              When testing in the studio, the Section Editor on the bottom right
              will auto-generate based on this schema.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
