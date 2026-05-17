import React from "react";
import { BlockProps } from "../types";
import DOMPurify from "dompurify";

const Html: React.FC<BlockProps> = ({ data, isPreview }) => {
  const code = data.code || "";

  if (!code && isPreview) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/20 text-muted-foreground text-sm">
        <p className="font-semibold">Custom HTML Block</p>
        <p className="text-xs opacity-70">Paste your code in the sidebar to preview.</p>
      </div>
    );
  }

  if (!code) return null;

  // Safely sanitize the HTML to strip malicious scripts, 
  // but explicitly allow styles and iframes (for embeds like Calendly/YouTube)
  const cleanHtml = DOMPurify.sanitize(code, {
    ADD_TAGS: ["style", "iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"],
    FORCE_BODY: true,
  });

  return (
    <div
      className="w-full html-embed-container"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};

export default Html;