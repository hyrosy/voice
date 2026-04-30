import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  useOutletContext,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { ActorDashboardContextType } from "../../layouts/ActorDashboardLayout";
import { supabase } from "../../supabaseClient";
import Editor, { useMonaco } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Play,
  UploadCloud,
  Code2,
  AlertTriangle,
  FileCode2,
  FolderTree,
  File,
  Settings2,
  LayoutTemplate,
  Layers,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Cloud,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import * as Babel from "@babel/standalone";
import SdkDocsModal from "@/components/dashboard/SdkDocsModal";
// At the top of ThemeStudioPage.tsx
import cupertinoHeaderRaw from "../../themes/cupertino/Header.tsx?raw";
import ucpTypesRaw from "../../lib/ucp-sdk/types.d.ts?raw";
import cupertinoHeroRaw from "../../themes/cupertino/Hero.tsx?raw";
import cupertinoGalleryRaw from "../../themes/cupertino/Gallery.tsx?raw";

const INITIAL_FILES: Record<string, string> = {
  "Header.tsx": cupertinoHeaderRaw,
  "Hero.tsx": cupertinoHeroRaw,
  "Gallery.tsx": cupertinoGalleryRaw,
    "Contact.tsx": cupertinoGalleryRaw,
        "Team.tsx": cupertinoGalleryRaw,
    "Map.tsx": cupertinoGalleryRaw,
    "Pricing.tsx": cupertinoGalleryRaw,
    "LeadForm.tsx": cupertinoGalleryRaw,
    "Shop.tsx": cupertinoGalleryRaw,


};
// 🚀 UPGRADED SANDBOX: Now injects Walled Garden SDK (TailwindMerge, Framer Motion, Lucide)
// 🚀 UPGRADED SANDBOX: Bulletproof UMD Polyfills and Proxies
// 🚀 THE EXPANDED AAA+ SDK SANDBOX
const IFRAME_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
  
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  
  <script>
     window.react = window.React;
     window['react-dom'] = window.ReactDOM;
  </script>

  <script src="https://unpkg.com/clsx@2.1.1/dist/clsx.min.js"></script>
  <script src="https://unpkg.com/framer-motion@11.0.8/dist/framer-motion.js"></script>
  <script src="https://unpkg.com/lucide-react@0.330.0/dist/umd/lucide-react.min.js"></script>
  
  <script src="https://unpkg.com/recharts@2.12.0/umd/Recharts.js"></script>
  <script src="https://unpkg.com/react-use@17.5.0/lib/index.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"></script>
  <script src="https://unpkg.com/date-fns@3.3.1/cdn.min.js"></script>
  
  <style>
    body { margin: 0; background: #ffffff; font-family: sans-serif; }
    .error-screen { color: #ef4444; background: #fef2f2; padding: 1.5rem; font-family: monospace; white-space: pre-wrap; height: 100vh; border-left: 4px solid #ef4444; }
  </style>
</head>
<body>
  <div id="preview-root"></div>
  <script>
    // Bulletproof CN
    const cn = (...inputs) => {
       if (typeof window.clsx === 'function') return window.clsx(inputs);
       if (window.clsx && typeof window.clsx.clsx === 'function') return window.clsx.clsx(inputs);
       return inputs.flat().filter(Boolean).join(' ');
    };

    window._sandboxRoot = ReactDOM.createRoot(document.getElementById('preview-root'));
    
    let CurrentComponent = null;
    let currentProps = {};
    let compiledComponents = {}; 
    let isFullPageMode = false;

    // THE UCP SDK
    const UCP = {
      Text: function UCPText({ field, default: defaultText, className, as: Tag = "span" }) {
        const value = currentProps[field] !== undefined ? currentProps[field] : (defaultText || "");
        
        const handleInput = (e) => {
           window.parent.postMessage({
              type: 'UCP_INLINE_EDIT',
              field: field,
              value: e.currentTarget.textContent
           }, '*');
        };

        return React.createElement(Tag, {
           className: cn(className, "outline-none hover:ring-2 hover:ring-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-text rounded-sm px-1 -ml-1"),
           contentEditable: true,
           suppressContentEditableWarning: true,
           onBlur: handleInput,
           onKeyUp: (e) => { if(e.key === 'Enter') e.currentTarget.blur() }
        }, value);
      }
    };

    function renderComponent() {
      if (isFullPageMode) {
         const children = Object.keys(compiledComponents).map(key => {
            const Comp = compiledComponents[key];
            const defaultData = {};
            if (Comp.schema) {
              if (Array.isArray(Comp.schema)) {
                Comp.schema.forEach(item => defaultData[item.id] = item.defaultValue);
              } else {
                Object.keys(Comp.schema).forEach(k => defaultData[k] = Comp.schema[k].default);
              }
            }
            return React.createElement(Comp, { key: key, data: defaultData });
         });
         window._sandboxRoot.render(React.createElement('div', { className: 'w-full min-h-screen flex flex-col bg-zinc-950' }, children));
      } else if (CurrentComponent) {
         window._sandboxRoot.render(React.createElement(CurrentComponent, { data: currentProps }));
      }
    }
    
    // 🚀 THE EXPANDED BOUNCER
    const fakeRequire = (mod) => {
      // Core
      if (mod === 'react') return window.React;
      if (mod === 'react-dom') return window.ReactDOM;
      if (mod === '@/lib/utils') return { cn };
      if (mod === '@ucp/sdk') return { UCP };
      
      // UI & Styling
      if (mod === 'framer-motion') return window.Motion || window.FramerMotion;
      if (mod === 'lucide-react') {
        const lucideModule = window.lucideReact || window.LucideReact || window.lucide || {};
        return new Proxy(lucideModule, {
          get: function(target, prop) {
            if (prop === 'default' || prop === '__esModule') return target;
            if (target[prop]) return target[prop];
            return () => React.createElement('span', { className: 'text-red-500 text-xs font-mono border border-red-500 rounded px-1' }, '[' + prop + ']');
          }
        });
      }

      // 🚀 THE NEW EXPANSION PACK INTERCEPTS
      if (mod === 'recharts') return window.Recharts;
      if (mod === 'react-use') return window.reactUse;
      if (mod === 'canvas-confetti') return window.confetti;
      if (mod === 'date-fns') return window.dateFns;
      
      throw new Error('Security Block: Importing external module "' + mod + '" is not permitted. Check the SDK Docs for available libraries.');
    };

    window.addEventListener('message', (event) => {
      if (event.data.type === 'EXECUTE_BUNDLE') {
         isFullPageMode = true;
         try {
            compiledComponents = {};
            Object.keys(event.data.bundle).forEach(filename => {
               const exports = {};
               const module = { exports };
               const execute = new Function('exports', 'require', 'module', 'React', event.data.bundle[filename]);
               execute(exports, fakeRequire, module, window.React);

               const Comp = exports.default || module.exports.default || exports;
               if (Comp && typeof Comp === 'function') {
                  compiledComponents[filename.replace('.tsx', '')] = Comp;
               }
            });

            window.parent.postMessage({ type: 'FULL_PAGE_READY' }, '*');
            renderComponent();
         } catch (error) {
            console.error("Bundle Error:", error);
            document.getElementById('preview-root').innerHTML = '<div class="error-screen"><strong>Bundle Error:</strong><br/>' + error.toString() + '</div>';
            window._sandboxRoot = ReactDOM.createRoot(document.getElementById('preview-root'));
         }
      }

      if (event.data.type === 'EXECUTE_CODE') {
        isFullPageMode = false;
        try {
          const exports = {};
          const module = { exports };

          const execute = new Function('exports', 'require', 'module', 'React', event.data.code);
          execute(exports, fakeRequire, module, window.React);

          CurrentComponent = exports.default || module.exports.default || exports;
          
          if (!CurrentComponent || typeof CurrentComponent !== 'function') {
             throw new Error("You must 'export default' a valid React function component.");
          }

          let parsedSchema = CurrentComponent.schema || {};
          if (Array.isArray(parsedSchema)) {
            const objSchema = {};
            parsedSchema.forEach(item => {
              objSchema[item.id] = { type: item.type, label: item.label, default: item.defaultValue, options: item.options };
            });
            parsedSchema = objSchema;
          }

          window.parent.postMessage({ type: 'SCHEMA_PARSED', schema: parsedSchema }, '*');
          renderComponent();
        } catch (error) {
          console.error("Sandbox Error:", error);
          document.getElementById('preview-root').innerHTML = '<div class="error-screen"><strong>Runtime Error:</strong><br/>' + error.toString() + '</div>';
          window._sandboxRoot = ReactDOM.createRoot(document.getElementById('preview-root'));
        }
      }

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const themeId = searchParams.get("themeId");

  const [isLoading, setIsLoading] = useState(true);
  const [themeData, setThemeData] = useState<any>(null);

  const [files, setFiles] = useState<Record<string, string>>(INITIAL_FILES);
  const [activeFile, setActiveFile] = useState<string>("Hero.tsx");
  const [previewMode, setPreviewMode] = useState<"single" | "full">("single");

  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [isDocsOpen, setIsDocsOpen] = useState(false); // 🚀 DOCS MODAL STATE

  const [activeSchema, setActiveSchema] = useState<Record<string, any>>({});
  const [mockData, setMockData] = useState<Record<string, any>>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // 🚀 ADD THIS NEW HOOK
  const monaco = useMonaco();

  useEffect(() => {
    const fetchTheme = async () => {
      if (!themeId || !actorData?.id) return;
      const { data, error } = await supabase
        .from("marketplace_themes")
        .select("*")
        .eq("id", themeId)
        .eq("developer_id", actorData.id)
        .single();

      if (error) {
        alert("Theme not found or access denied.");
        navigate("/dashboard/creator-hub");
        return;
      }

      setThemeData(data);
      if (data.files && Object.keys(data.files).length > 0) {
        setFiles(data.files);
      }
      setIsLoading(false);
    };

    fetchTheme();
  }, [themeId, actorData?.id, navigate]);

  useEffect(() => {
    if (!hasUnsavedChanges || !themeId || isLoading) return;

    const autoSaveTimer = setTimeout(async () => {
      setIsSaving(true);

      const { error } = await supabase
        .from("marketplace_themes")
        .update({
          files: files,
          updated_at: new Date().toISOString(),
        })
        .eq("id", themeId);

      if (!error) {
        setHasUnsavedChanges(false);
      } else {
        console.error("Failed to auto-save:", error);
      }
      setIsSaving(false);
    }, 1500);

    return () => clearTimeout(autoSaveTimer);
  }, [files, hasUnsavedChanges, themeId, isLoading]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === "SCHEMA_PARSED") {
        const schema = e.data.schema;
        setActiveSchema(schema);
        const initialData: Record<string, any> = {};
        Object.keys(schema).forEach((key) => {
          initialData[key] =
            mockData[key] !== undefined
              ? mockData[key]
              : schema[key].default || "";
        });
        setMockData(initialData);
        updateIframeProps(initialData);
      }

      if (e.data.type === "FULL_PAGE_READY") {
        setActiveSchema({});
      }

      if (e.data.type === "UCP_INLINE_EDIT") {
        // Update the mockData state, which will automatically re-render the iframe!
        setMockData((prev) => {
          const newData = { ...prev, [e.data.field]: e.data.value };
          updateIframeProps(newData); // Send it right back down
          return newData;
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [mockData]);

  const updateIframeProps = (newData: Record<string, any>) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "UPDATE_PROPS", props: newData },
        "*"
      );
    }
  };
  // 🚀 MONACO COMPILER CONFIGURATION
  // 🚀 MONACO COMPILER CONFIGURATION
  // 🚀 MONACO COMPILER CONFIGURATION
  const handleEditorWillMount = (m: any) => {
    const ts = m.languages.typescript as any;

    ts.typescriptDefaults.setCompilerOptions({
      jsx: ts.JsxEmit.React,
      jsxFactory: "React.createElement",
      reactNamespace: "React",
      allowNonTsExtensions: true,
      allowJs: true,
      target: ts.ScriptTarget.Latest,
    });

    ts.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });

    // 🚀 2. INJECT THE UCP TYPES HERE
    ts.typescriptDefaults.addExtraLib(
      ucpTypesRaw, 
      'file:///node_modules/@types/ucp-sdk/index.d.ts'
    );
  };

  const handlePropChange = (key: string, value: string | boolean) => {
    const newData = { ...mockData, [key]: value };
    setMockData(newData);
    updateIframeProps(newData);
  };

  const handleEditorChange = (value: string | undefined) => {
    setFiles((prev) => ({ ...prev, [activeFile]: value || "" }));
    setHasUnsavedChanges(true);
  };

  const handleCompileAndRun = useCallback(() => {
    setIsCompiling(true);
    setCompileError(null);

    setTimeout(() => {
      try {
        if (previewMode === "single") {
          const result = Babel.transform(files[activeFile], {
            presets: ["react", "env", "typescript"],
            filename: activeFile,
          });
          iframeRef.current?.contentWindow?.postMessage(
            { type: "EXECUTE_CODE", code: result?.code },
            "*"
          );
        } else {
          const bundle: Record<string, string> = {};
          const order = ["Header.tsx", "Hero.tsx", "Footer.tsx"];

          const allKeys = [...new Set([...order, ...Object.keys(files)])];

          allKeys.forEach((filename) => {
            if (files[filename]) {
              const result = Babel.transform(files[filename], {
                presets: ["react", "env", "typescript"],
                filename,
              });
              if (result?.code) bundle[filename] = result.code;
            }
          });

          iframeRef.current?.contentWindow?.postMessage(
            { type: "EXECUTE_BUNDLE", bundle },
            "*"
          );
        }
      } catch (err: any) {
        setCompileError(err.message);
      } finally {
        setIsCompiling(false);
      }
    }, 50);
  }, [files, activeFile, previewMode]);

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => handleCompileAndRun(), 300);
    return () => clearTimeout(timer);
  }, [activeFile, previewMode, isLoading, handleCompileAndRun]);

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-zinc-950 text-zinc-50 overflow-hidden">
      {/* --- STUDIO TOPBAR --- */}
      <div className="h-14 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between px-4 shrink-0 shadow-sm z-10 relative">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-white"
            onClick={() => navigate("/dashboard/creator-hub")}
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="h-8 w-8 bg-indigo-500/20 border border-indigo-500/30 rounded-md flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Code2 size={18} />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight flex items-center gap-2">
              {themeData?.name || "Theme Studio"}
              <Badge
                variant="outline"
                className="text-[10px] h-5 border-zinc-700 bg-zinc-800 text-zinc-300"
              >
                {themeData?.status || "Draft"}
              </Badge>
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
              <FolderTree size={10} /> src/components
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1.5">
            {isSaving ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Saving...
              </>
            ) : hasUnsavedChanges ? (
              <>
                <Cloud size={12} /> Unsaved
              </>
            ) : (
              <>
                <CheckCircle2 size={12} className="text-emerald-500" /> Saved
              </>
            )}
          </div>
          <div className="w-px h-6 bg-zinc-800 mx-1"></div>

          {/* 🚀 DOCS BUTTON ADDED HERE */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={() => setIsDocsOpen(true)}
          >
            <BookOpen size={14} className="mr-2" /> SDK Docs
          </Button>

          <Button
            size="sm"
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <UploadCloud size={14} className="mr-2" /> Publish Request
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
                onClick={() => {
                  setActiveFile(filename);
                  setPreviewMode("single");
                }}
                className={cn(
                  "flex items-center gap-2 px-6 py-1.5 cursor-pointer text-sm font-mono transition-colors border-l-2",
                  activeFile === filename && previewMode === "single"
                    ? "bg-indigo-500/10 text-indigo-300 border-indigo-500"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border-transparent"
                )}
              >
                <FileCode2
                  size={14}
                  className={
                    activeFile === filename && previewMode === "single"
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
              path={activeFile}
              language={
                activeFile.endsWith(".tsx") || activeFile.endsWith(".ts")
                  ? "typescript"
                  : "javascript"
              }
              theme="vs-dark"
              value={files[activeFile]}
              onChange={handleEditorChange}
              beforeMount={handleEditorWillMount} // 🚀 ADD THIS LINE
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
              <div className="absolute bottom-4 left-4 right-4 bg-red-950/90 border border-red-500/50 p-3 rounded-lg shadow-xl backdrop-blur-md z-10">
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

        {/* RIGHT SIDE: Preview */}
        <div className="w-[45%] xl:w-[40%] h-full flex flex-col shrink-0 bg-zinc-950">
          <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 bg-zinc-900">
            <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  "h-7 px-3 text-xs",
                  previewMode === "single"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-white"
                )}
                onClick={() => setPreviewMode("single")}
              >
                <LayoutTemplate size={14} className="mr-1.5" /> Component
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  "h-7 px-3 text-xs",
                  previewMode === "full"
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                    : "text-zinc-400 hover:text-white"
                )}
                onClick={() => setPreviewMode("full")}
              >
                <Layers size={14} className="mr-1.5" /> Full Page
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-zinc-400 hover:text-white"
              onClick={handleCompileAndRun}
            >
              <Play size={14} className="mr-1.5" /> Refresh
            </Button>
          </div>

          <div
            className={cn(
              "flex flex-col min-h-0 relative transition-all duration-300",
              previewMode === "single"
                ? "flex-1 border-b border-zinc-800"
                : "h-full"
            )}
          >
            <div className="flex-grow bg-zinc-950/50 relative overflow-hidden flex items-center justify-center p-4">
              <iframe
                ref={iframeRef}
                srcDoc={IFRAME_TEMPLATE}
                className={cn(
                  "bg-white border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-500",
                  previewMode === "full"
                    ? "w-full h-full rounded-md"
                    : "w-full max-w-2xl h-[500px] rounded-xl"
                )}
                title="Live Sandbox"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>

          {previewMode === "single" && (
            <div className="flex-[0.8] flex flex-col bg-zinc-900 shrink-0 min-h-0">
              <div className="h-8 border-b border-zinc-800 flex items-center px-4 text-[11px] font-mono text-indigo-400 uppercase tracking-widest gap-2 bg-indigo-500/5 shrink-0">
                <Settings2 size={12} /> Section Editor Test
              </div>
              <div className="flex-grow overflow-y-auto p-4 custom-scrollbar space-y-4">
                {Object.keys(activeSchema).length === 0 ? (
                  <div className="text-center text-zinc-500 text-sm mt-8 border border-dashed border-zinc-700 rounded-xl p-6">
                    No <code>.schema</code> object found.
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
                          onChange={(e) =>
                            handlePropChange(key, e.target.value)
                          }
                          className="bg-zinc-950 border-zinc-800 text-sm h-9 text-zinc-100"
                        />
                      )}

                      {field.type === "toggle" && (
                        <div className="flex items-center h-9">
                          <input
                            type="checkbox"
                            checked={
                              mockData[key] !== undefined
                                ? mockData[key]
                                : field.default || false
                            }
                            onChange={(e) =>
                              handlePropChange(key, e.target.checked)
                            }
                            className="w-4 h-4 cursor-pointer"
                          />
                        </div>
                      )}

                      {field.type === "select" && (
                        <select
                          value={mockData[key] || field.default}
                          onChange={(e) =>
                            handlePropChange(key, e.target.value)
                          }
                          className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm shadow-sm transition-colors text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                        >
                          {field.options?.map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {field.type === "color" && (
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={mockData[key] || "#000000"}
                            onChange={(e) =>
                              handlePropChange(key, e.target.value)
                            }
                            className="w-8 h-8 rounded border border-zinc-700 cursor-pointer p-0"
                          />
                          <Input
                            value={mockData[key] || ""}
                            onChange={(e) =>
                              handlePropChange(key, e.target.value)
                            }
                            className="bg-zinc-950 border-zinc-800 font-mono text-xs h-9 uppercase text-zinc-100"
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🚀 THE SDK DOCUMENTATION MODAL */}
      <SdkDocsModal isOpen={isDocsOpen} onOpenChange={setIsDocsOpen} />
    </div>
  );
}
