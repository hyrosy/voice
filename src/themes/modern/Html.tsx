import React from "react";
import { BlockProps } from "../types";
import DOMPurify from "dompurify";

const Html: React.FC<BlockProps> = ({ data, isPreview }) => {
  const code = data.code || "";
  const allowJs = data.allowJavascript || false;
  const useTailwind = data.useTailwind || false;
  const useFullPage = data.useFullPage || false;

  if (!code && isPreview) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/20 text-muted-foreground text-sm">
        <p className="font-semibold">Custom HTML Block</p>
        <p className="text-xs opacity-70">Paste your code in the sidebar to preview.</p>
      </div>
    );
  }

  if (!code) return null;

  // 🚀 IF JAVASCRIPT IS ENABLED: Render inside a strictly isolated sandbox!
  if (allowJs) {
    // Inject the UCP SDK automatically into the user's sandboxed environment
    const sdkScript = `
      <style>body { margin: 0; overflow-x: hidden; }</style>
      ${useTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
      ${useTailwind ? '<script>tailwind.config = { corePlugins: { preflight: false } }</script>' : ''}
      <script>
        window.UCP = {
          addToCart: function(productId, quantity = 1) {
            window.parent.postMessage({
              type: 'UCP_ADD_TO_CART',
              payload: { productId, quantity }
            }, '*');
          },
          checkout: function(planId) {
            window.parent.postMessage({
              type: 'UCP_CHECKOUT',
              payload: { planId }
            }, '*');
          }
        };
      </script>
    `;
    const injectedCode = `${sdkScript}\n${code}`;
    return (
      <iframe 
        sandbox="allow-scripts allow-popups allow-forms" 
        srcDoc={injectedCode} 
        className="w-full border-0 bg-transparent transition-all duration-300" 
        style={{ width: '100%', height: useFullPage ? '100vh' : `${data.iframeHeight || 600}px` }} 
        title="Custom Sandboxed Block" 
      />
    );
  }

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