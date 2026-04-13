import React, { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { ActorDashboardContextType } from "../../layouts/ActorDashboardLayout";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Play, Save, UploadCloud, Code2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// 🚀 1. IMPORT THE BROWSER COMPILER
import * as Babel from "@babel/standalone";

const DEFAULT_COMPONENT_CODE = `import React from 'react';

export default function CustomHeader({ data }) {
  return (
    <header className="w-full bg-white p-6 border-b flex justify-between items-center">
      <h1 className="text-2xl font-black text-indigo-600">
        {data.logoText || "My Custom Theme"}
      </h1>
      <nav className="flex gap-4">
        <a href="#about" className="text-gray-600 hover:text-black font-medium">About</a>
        <a href="#contact" className="text-gray-600 hover:text-black font-medium">Contact</a>
      </nav>
    </header>
  );
}
`;

// 🚀 2. THE SECURE IFRAME SANDBOX
// This is a complete HTML document that runs inside the iframe.
// It loads Tailwind, React, and listens for code from Monaco.
const IFRAME_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <style>
    body { margin: 0; background: #ffffff; font-family: sans-serif; }
    .error-screen { color: #ef4444; background: #fef2f2; padding: 1.5rem; font-family: monospace; white-space: pre-wrap; height: 100vh; border-left: 4px solid #ef4444; }
  </style>
</head>
<body>
  <div id="preview-root"></div>
  <script>
    // Create the React 18 Root
    window._sandboxRoot = ReactDOM.createRoot(document.getElementById('preview-root'));
    
    // Listen for transpiled code from the main window
    window.addEventListener('message', (event) => {
      if (event.data.type === 'EXECUTE_CODE') {
        try {
          // 1. Create a mock Node.js environment
          const exports = {};
          const module = { exports };
          
          // Fake 'require' so "import React from 'react'" doesn't crash the browser
          const require = (mod) => {
            if (mod === 'react') return window.React;
            throw new Error('Importing external module "' + mod + '" is not supported in the sandbox yet.');
          };

          // 2. Safely evaluate the Babel-transpiled code
          const execute = new Function('exports', 'require', 'module', 'React', event.data.code);
          execute(exports, require, module, window.React);

          // 3. Find the component they exported
          const Component = exports.default || module.exports.default || exports;
          
          if (!Component || typeof Component !== 'function') {
             throw new Error("You must 'export default' a valid React function component.");
          }

          // 4. Inject Mock Data (This simulates your 'sections.ts' contract!)
          const mockData = { 
            logoText: "Live Studio Preview",
            title: "Hello World",
            description: "This data is passed down via props."
          };

          // 5. Render it to the screen!
          window._sandboxRoot.render(React.createElement(Component, { data: mockData }));

        } catch (error) {
          console.error("Sandbox Error:", error);
          document.getElementById('preview-root').innerHTML = 
            '<div class="error-screen"><strong>Runtime Error:</strong><br/>' + error.toString() + '</div>';
          
          // Reset the root in case it crashed completely
          window._sandboxRoot = ReactDOM.createRoot(document.getElementById('preview-root'));
        }
      }
    });
  </script>
</body>
</html>
`;

export default function ThemeStudioPage() {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const [code, setCode] = useState(DEFAULT_COMPONENT_CODE);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 🚀 3. THE COMPILER ENGINE
  const handleCompileAndRun = () => {
    setIsCompiling(true);
    setCompileError(null);

    // Slight timeout so the "Compiling..." UI has time to render
    setTimeout(() => {
      try {
        // 1. Babel transpiles the JSX into raw ES5 Javascript
        const result = Babel.transform(code, {
          presets: ["react", "env"],
          filename: "CustomComponent.tsx",
        });

        // 2. Send the raw JS down to the hidden iframe
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            {
              type: "EXECUTE_CODE",
              code: result?.code,
            },
            "*"
          );
        }
      } catch (err: any) {
        // If they forget a bracket or have a syntax error, Babel catches it instantly
        console.error("Compilation Error:", err);
        setCompileError(err.message);
      } finally {
        setIsCompiling(false);
      }
    }, 50);
  };

  // Run once on load so the initial code renders automatically
  useEffect(() => {
    // Wait a brief moment for the iframe DOM to finish mounting
    const timer = setTimeout(() => {
      handleCompileAndRun();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-zinc-950 text-zinc-50 overflow-hidden">
      {/* --- STUDIO TOPBAR --- */}
      <div className="h-14 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-indigo-500/20 rounded-md flex items-center justify-center text-indigo-400">
            <Code2 size={18} />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight flex items-center gap-2">
              Neon Cyberpunk{" "}
              <Badge
                variant="outline"
                className="text-[10px] h-5 border-zinc-700 bg-zinc-800 text-zinc-300"
              >
                Draft
              </Badge>
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono">
              Editing: Header.tsx
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Save size={14} className="mr-2" /> Save Draft
          </Button>
          <Button
            size="sm"
            className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold min-w-[120px]"
            onClick={handleCompileAndRun}
            disabled={isCompiling}
          >
            {isCompiling ? (
              "Compiling..."
            ) : (
              <>
                <Play size={14} className="mr-2 fill-current" /> Run Code
              </>
            )}
          </Button>
          <div className="w-px h-6 bg-zinc-800 mx-1"></div>
          <Button
            size="sm"
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <UploadCloud size={14} className="mr-2" /> Publish to Store
          </Button>
        </div>
      </div>

      {/* --- STUDIO WORKSPACE --- */}
      <div className="flex flex-grow overflow-hidden">
        {/* LEFT: Monaco Editor */}
        <div className="w-1/2 h-full border-r border-zinc-800 flex flex-col">
          <div className="h-8 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
            components/Header.tsx
          </div>
          <div className="flex-grow relative">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                formatOnPaste: true,
                padding: { top: 16 },
                fontFamily: "JetBrains Mono, monospace",
              }}
            />

            {/* Syntax Error Overlay (Floating at bottom of editor) */}
            {compileError && (
              <div className="absolute bottom-4 left-4 right-4 bg-red-950/90 border border-red-500/50 p-3 rounded-lg shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 z-10">
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className="text-red-400 shrink-0 mt-0.5"
                    size={16}
                  />
                  <div className="text-red-200 text-xs font-mono whitespace-pre-wrap break-words leading-relaxed overflow-auto max-h-32">
                    {compileError}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Live Preview Sandbox */}
        <div className="w-1/2 h-full bg-zinc-950 flex flex-col relative">
          <div className="h-8 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
            Live Preview
          </div>
          <div className="flex-grow p-4 lg:p-8 bg-zinc-950/50">
            {/* The MAGIC Iframe */}
            <div className="w-full h-full bg-white rounded-xl border border-zinc-800 overflow-hidden shadow-2xl relative">
              <iframe
                ref={iframeRef}
                srcDoc={IFRAME_TEMPLATE}
                className="absolute inset-0 w-full h-full border-none"
                title="Live Sandbox"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
