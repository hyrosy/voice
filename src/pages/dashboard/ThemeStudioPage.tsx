import React, { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { ActorDashboardContextType } from "../../layouts/ActorDashboardLayout";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Play,
  Save,
  UploadCloud,
  Code2,
  AlertTriangle,
  FileCode2,
  FolderTree,
  File,
  Settings2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import * as Babel from "@babel/standalone";

// 🚀 1. THE FILE SYSTEM WITH SCHEMA ATTACHED
const INITIAL_FILES: Record<string, string> = {
  "Hero.tsx": `import React from 'react';

export default function CustomHero({ data }) {
  return (
    <section 
      className="w-full min-h-[500px] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: data.bgColor || '#09090b', color: data.textColor || '#ffffff' }}
    >
      <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full"></div>
      <h2 className="text-6xl font-black mb-4 relative z-10">
        {data.title || "The Future is Now"}
      </h2>
      <p className="text-xl max-w-2xl relative z-10 opacity-80">
        {data.subtitle || "A dark, immersive theme for creators."}
      </p>
      <button className="mt-8 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full relative z-10 transition-all">
        {data.ctaText || "Get Started"}
      </button>
    </section>
  );
}

// 🚀 THE MAGIC: The Developer defines the schema here!
CustomHero.schema = {
  title: { type: "string", label: "Hero Title", default: "The Future is Now" },
  subtitle: { type: "string", label: "Subtitle", default: "A dark, immersive theme for creators." },
  ctaText: { type: "string", label: "Button Text", default: "Get Started" },
  bgColor: { type: "color", label: "Background Color", default: "#09090b" },
  textColor: { type: "color", label: "Text Color", default: "#ffffff" }
};
`,
  "Header.tsx": `import React from 'react';\n\nexport default function CustomHeader({ data }) {\n  return <header className="p-6 bg-zinc-950 text-white">Header</header>;\n}\n\nCustomHeader.schema = {};`,
};

// 🚀 2. THE UPGRADED SECURE IFRAME SANDBOX
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
    window._sandboxRoot = ReactDOM.createRoot(document.getElementById('preview-root'));
    
    let CurrentComponent = null;
    let currentProps = {};

    function renderComponent() {
      if (CurrentComponent) {
        window._sandboxRoot.render(React.createElement(CurrentComponent, { data: currentProps }));
      }
    }
    
    window.addEventListener('message', (event) => {
      // EVENT A: COMPILE AND EXTRACT SCHEMA
      if (event.data.type === 'EXECUTE_CODE') {
        try {
          const exports = {};
          const module = { exports };
          const require = (mod) => {
            if (mod === 'react') return window.React;
            throw new Error('Importing external module "' + mod + '" is not supported yet.');
          };

          const execute = new Function('exports', 'require', 'module', 'React', event.data.code);
          execute(exports, require, module, window.React);

          CurrentComponent = exports.default || module.exports.default || exports;
          
          if (!CurrentComponent || typeof CurrentComponent !== 'function') {
             throw new Error("You must 'export default' a valid React function component.");
          }

          // 🚀 SEND SCHEMA BACK TO PARENT STUDIO
          window.parent.postMessage({ 
            type: 'SCHEMA_PARSED', 
            schema: CurrentComponent.schema || {} 
          }, '*');

          // Initial Render
          renderComponent();

        } catch (error) {
          console.error("Sandbox Error:", error);
          document.getElementById('preview-root').innerHTML = 
            '<div class="error-screen"><strong>Runtime Error:</strong><br/>' + error.toString() + '</div>';
          window._sandboxRoot = ReactDOM.createRoot(document.getElementById('preview-root'));
        }
      }

      // 🚀 EVENT B: LIVE UPDATE PROPS FROM STUDIO
      if (event.data.type === 'UPDATE_PROPS') {
        currentProps = event.data.props;
        renderComponent();
      }
    });
  </script>
</body>
</html>
`;

export default function ThemeStudioPage() {
  const { actorData } = useOutletContext<ActorDashboardContextType>();

  const [files, setFiles] = useState<Record<string, string>>(INITIAL_FILES);
  const [activeFile, setActiveFile] = useState<string>("Hero.tsx");

  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);

  // 🚀 3. THE LIVE PROP & SCHEMA STATE
  const [activeSchema, setActiveSchema] = useState<Record<string, any>>({});
  const [mockData, setMockData] = useState<Record<string, any>>({});

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for the Iframe sending the Schema UP to us
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === "SCHEMA_PARSED") {
        const schema = e.data.schema;
        setActiveSchema(schema);

        // Auto-populate mockData based on schema defaults!
        const initialData: Record<string, any> = {};
        Object.keys(schema).forEach((key) => {
          initialData[key] = schema[key].default || "";
        });
        setMockData(initialData);

        // Immediately send the defaults BACK DOWN to the iframe to render
        updateIframeProps(initialData);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const updateIframeProps = (newData: Record<string, any>) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "UPDATE_PROPS",
          props: newData,
        },
        "*"
      );
    }
  };

  // When the dev types in the Mock Settings UI
  const handlePropChange = (key: string, value: string) => {
    const newData = { ...mockData, [key]: value };
    setMockData(newData);
    updateIframeProps(newData); // Instantly update the iframe!
  };

  const handleEditorChange = (value: string | undefined) => {
    setFiles((prev) => ({
      ...prev,
      [activeFile]: value || "",
    }));
  };

  const handleCompileAndRun = () => {
    setIsCompiling(true);
    setCompileError(null);
    const codeToRun = files[activeFile];

    setTimeout(() => {
      try {
        const result = Babel.transform(codeToRun, {
          presets: ["react", "env"],
          filename: activeFile,
        });

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
        setCompileError(err.message);
      } finally {
        setIsCompiling(false);
      }
    }, 50);
  };

  useEffect(() => {
    const timer = setTimeout(() => handleCompileAndRun(), 300);
    return () => clearTimeout(timer);
  }, [activeFile]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-zinc-950 text-zinc-50 overflow-hidden">
      {/* --- STUDIO TOPBAR --- */}
      <div className="h-14 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between px-4 shrink-0 shadow-sm z-10 relative">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-indigo-500/20 border border-indigo-500/30 rounded-md flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
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
            <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
              <FolderTree size={10} /> src/components
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
            className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold min-w-[130px] shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all"
            onClick={handleCompileAndRun}
            disabled={isCompiling}
          >
            {isCompiling ? (
              "Compiling..."
            ) : (
              <>
                <Play size={14} className="mr-2 fill-current" /> Run{" "}
                {activeFile.replace(".tsx", "")}
              </>
            )}
          </Button>
          <div className="w-px h-6 bg-zinc-800 mx-1"></div>
          <Button
            size="sm"
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <UploadCloud size={14} className="mr-2" /> Publish Theme
          </Button>
        </div>
      </div>

      {/* --- STUDIO WORKSPACE --- */}
      <div className="flex flex-grow overflow-hidden">
        {/* LEFT: Explorer */}
        <div className="w-64 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
          <div className="h-8 border-b border-zinc-800 flex items-center px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-900/50">
            Explorer
          </div>
          <div className="flex-grow overflow-y-auto py-2">
            {Object.keys(files).map((filename) => (
              <div
                key={filename}
                onClick={() => setActiveFile(filename)}
                className={cn(
                  "flex items-center gap-2 px-6 py-1.5 cursor-pointer text-sm font-mono transition-colors border-l-2",
                  activeFile === filename
                    ? "bg-indigo-500/10 text-indigo-300 border-indigo-500"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border-transparent"
                )}
              >
                <FileCode2
                  size={14}
                  className={
                    activeFile === filename
                      ? "text-indigo-400"
                      : "text-zinc-500"
                  }
                />
                {filename}
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE: Monaco */}
        <div className="flex-grow h-full border-r border-zinc-800 flex flex-col relative min-w-0">
          <div className="h-8 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 text-[11px] font-mono text-zinc-300 gap-2">
            <File size={12} className="text-zinc-500" /> {activeFile}
          </div>
          <div className="flex-grow relative">
            <Editor
              height="100%"
              language="javascript"
              theme="vs-dark"
              value={files[activeFile]}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                formatOnPaste: true,
                padding: { top: 16 },
                fontFamily: "JetBrains Mono, monospace",
              }}
            />

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

        {/* RIGHT SIDE: Split Vertically (Preview Top, Schema Bottom) */}
        <div className="w-[40%] xl:w-[35%] h-full flex flex-col shrink-0 bg-zinc-950">
          {/* TOP: Live Sandbox */}
          <div className="flex-1 flex flex-col min-h-0 border-b border-zinc-800 relative">
            <div className="h-8 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 text-[11px] font-mono text-zinc-400 uppercase tracking-widest justify-between shrink-0">
              <span>Live Preview</span>
            </div>
            <div className="flex-grow bg-zinc-950/50 relative overflow-hidden">
              <iframe
                ref={iframeRef}
                srcDoc={IFRAME_TEMPLATE}
                className="absolute inset-0 w-full h-full border-none bg-white"
                title="Live Sandbox"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>

          {/* BOTTOM: Schema Tester UI */}
          <div className="h-[40%] flex flex-col bg-zinc-900 shrink-0 min-h-0">
            <div className="h-8 border-b border-zinc-800 flex items-center px-4 text-[11px] font-mono text-indigo-400 uppercase tracking-widest gap-2 bg-indigo-500/5 shrink-0">
              <Settings2 size={12} /> Section Editor Test
            </div>

            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar space-y-4">
              {Object.keys(activeSchema).length === 0 ? (
                <div className="text-center text-zinc-500 text-sm mt-8 border border-dashed border-zinc-700 rounded-xl p-6">
                  No <code>.schema</code> object found on this component. <br />
                  Export a schema to build the editor UI.
                </div>
              ) : (
                Object.entries(activeSchema).map(([key, field]) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs text-zinc-300 font-bold uppercase tracking-wider">
                      {field.label}
                    </Label>

                    {field.type === "string" && (
                      <Input
                        value={mockData[key] || ""}
                        onChange={(e) => handlePropChange(key, e.target.value)}
                        className="bg-zinc-950 border-zinc-800 text-sm h-9 focus-visible:ring-indigo-500"
                      />
                    )}

                    {field.type === "color" && (
                      <div className="flex items-center gap-3">
                        <div
                          className="relative w-8 h-8 rounded border border-zinc-700 overflow-hidden shrink-0 cursor-pointer"
                          style={{ backgroundColor: mockData[key] }}
                        >
                          <input
                            type="color"
                            value={mockData[key] || "#000000"}
                            onChange={(e) =>
                              handlePropChange(key, e.target.value)
                            }
                            className="absolute inset-[-10px] w-[50px] h-[50px] cursor-pointer"
                          />
                        </div>
                        <Input
                          value={mockData[key] || ""}
                          onChange={(e) =>
                            handlePropChange(key, e.target.value)
                          }
                          className="bg-zinc-950 border-zinc-800 font-mono text-xs h-9 uppercase"
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
