import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  useOutletContext,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { ActorDashboardContextType } from "../../layouts/ActorDashboardLayout";
import { supabase } from "../../supabaseClient";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useQuery } from "@tanstack/react-query";
import { Button as UIButton } from "@/components/ui/button";
import { Input as UIInput } from "@/components/ui/input";
import { Label as UILabel } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Globe
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import * as Babel from "@babel/standalone";
import SdkDocsModal from "@/components/dashboard/SdkDocsModal";

// 🚀 IMPORT THE SDK & UI TYPE DEFINITIONS (AS STRINGS FOR MONACO)
import ucpSdkTypesRaw from "../../lib/ucp-sdk/types.d.ts?raw";
import uiTypesRaw from "../../lib/ucp-sdk/ui.d.ts?raw";

// Default Theme Files
import cupertinoHeaderRaw from "../../themes/cupertino/Header.tsx?raw";
import cupertinoHeroRaw from "../../themes/cupertino/Hero.tsx?raw";
import cupertinoGalleryRaw from "../../themes/cupertino/Gallery.tsx?raw";
import cupertinoContactRaw from "../../themes/cupertino/Contact.tsx?raw";
import cupertinoTeamRaw from "../../themes/cupertino/Team.tsx?raw";
import cupertinoMapRaw from "../../themes/cupertino/Map.tsx?raw";
import cupertinoPricingRaw from "../../themes/cupertino/Pricing.tsx?raw";
import cupertinoLeadFormRaw from "../../themes/cupertino/LeadForm.tsx?raw";
import cupertinoShopRaw from "../../themes/cupertino/Shop.tsx?raw";

const INITIAL_FILES: Record<string, string> = {
  "Header.tsx": cupertinoHeaderRaw,
  "Hero.tsx": cupertinoHeroRaw,
  "Gallery.tsx": cupertinoGalleryRaw,
  "Contact.tsx": cupertinoContactRaw,
  "Team.tsx": cupertinoTeamRaw,
  "Map.tsx": cupertinoMapRaw,
  "Pricing.tsx": cupertinoPricingRaw,
  "LeadForm.tsx": cupertinoLeadFormRaw,
  "Shop.tsx": cupertinoShopRaw,
};

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

  const [isDocsOpen, setIsDocsOpen] = useState(false); 

  const [activeSchema, setActiveSchema] = useState<Record<string, any>>({});
  const [mockData, setMockData] = useState<Record<string, any>>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // 🚀 TEST SITE SELECTION STATE
  const [selectedTestSiteId, setSelectedTestSiteId] = useState<string | null>(null);

  const monaco = useMonaco();

  // 🚀 FETCH THE DEVELOPER'S EXISTING SITES TO USE AS TEST DATA
  const { data: testSites = [] } = useQuery({
    queryKey: ["developerTestSites", actorData?.id],
    queryFn: async () => {
      if (!actorData?.id) return [];
      const { data } = await supabase
        .from("portfolios")
        .select("id, site_name")
        .eq("actor_id", actorData.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!actorData?.id,
  });

  // Auto-select the first site if none is selected
  useEffect(() => {
    if (testSites.length > 0 && !selectedTestSiteId) {
      setSelectedTestSiteId(testSites[0].id);
    }
  }, [testSites, selectedTestSiteId]);

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
      
      const fetchedFiles = data.files || {};
      const mergedFiles = { ...fetchedFiles };
      let missingFilesAdded = false;

      Object.keys(INITIAL_FILES).forEach(filename => {
          if (!mergedFiles[filename]) {
              mergedFiles[filename] = INITIAL_FILES[filename];
              missingFilesAdded = true;
          }
      });

      setFiles(mergedFiles);

      if (missingFilesAdded) {
          setHasUnsavedChanges(true);
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

  const handleCompileAndRun = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return;
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
            { 
              type: "EXECUTE_CODE", 
              code: result?.code,
              activeFile: activeFile // Send filename so the iframe knows which section data to pull
            },
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
    const handleMessage = (e: MessageEvent) => {
      // 🚀 Listen for the iframe telling us it has loaded the real React environment
      if (e.data.type === "PREVIEW_READY") {
         handleCompileAndRun();
      }

      if (e.data.type === "SCHEMA_PARSED") {
        const schema = e.data.schema;
        const testData = e.data.testData || {};
        setActiveSchema(schema);
        
        const initialData: Record<string, any> = { ...testData };
        Object.keys(schema).forEach((key) => {
          if (initialData[key] === undefined) {
             initialData[key] = schema[key].default || "";
          }
        });
        
        setMockData(initialData);
      }

      if (e.data.type === "FULL_PAGE_READY") {
        setActiveSchema({});
      }

      if (e.data.type === "UCP_INLINE_EDIT") {
        setMockData((prev) => {
          const newData = { ...prev, [e.data.field]: e.data.value };
          updateIframeProps(newData); 
          return newData;
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleCompileAndRun]);

  const updateIframeProps = (newData: Record<string, any>) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "UPDATE_PROPS", props: newData },
        "*"
      );
    }
  };

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
    ts.typescriptDefaults.addExtraLib(ucpSdkTypesRaw, 'file:///node_modules/@types/ucp-sdk/index.d.ts');
    ts.typescriptDefaults.addExtraLib(uiTypesRaw, 'file:///node_modules/@types/ucp-ui/index.d.ts');
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

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => handleCompileAndRun(), 300);
    return () => clearTimeout(timer);
  }, [activeFile, previewMode, isLoading, handleCompileAndRun, selectedTestSiteId]); // Re-compile if site changes

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
          <UIButton
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-white"
            onClick={() => navigate("/dashboard/creator-hub")}
          >
            <ArrowLeft size={16} />
          </UIButton>
          <div className="h-8 w-8 bg-indigo-500/20 border border-indigo-500/30 rounded-md flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Code2 size={18} />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight flex items-center gap-2">
              {themeData?.name || "Theme Studio"}
              <Badge variant="outline" className="text-[10px] h-5 border-zinc-700 bg-zinc-800 text-zinc-300">
                {themeData?.status || "Draft"}
              </Badge>
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
              <FolderTree size={10} /> src/components
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 🚀 NEW: TEST SITE SELECTOR */}
          <div className="flex items-center gap-2 border-r border-zinc-800 pr-4">
            <Globe size={14} className="text-zinc-500" />
            <Select value={selectedTestSiteId || ""} onValueChange={setSelectedTestSiteId}>
              <SelectTrigger className="h-8 w-[180px] bg-zinc-900 border-zinc-800 text-xs font-medium">
                <SelectValue placeholder="Select Test Site" />
              </SelectTrigger>
              <SelectContent>
                {testSites.map(site => (
                  <SelectItem key={site.id} value={site.id} className="text-xs font-medium">
                    {site.site_name || "Untitled Site"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1.5">
            {isSaving ? (
              <><Loader2 size={12} className="animate-spin" /> Saving...</>
            ) : hasUnsavedChanges ? (
              <><Cloud size={12} /> Unsaved</>
            ) : (
              <><CheckCircle2 size={12} className="text-emerald-500" /> Saved</>
            )}
          </div>
          
          <UIButton variant="ghost" size="sm" className="h-8 text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={() => setIsDocsOpen(true)}>
            <BookOpen size={14} className="mr-2" /> SDK Docs
          </UIButton>

          <UIButton size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            <UploadCloud size={14} className="mr-2" /> Publish Request
          </UIButton>
        </div>
      </div>

      {/* --- STUDIO WORKSPACE --- */}
      <div className="flex flex-grow overflow-hidden">
        {/* LEFT: Explorer */}
        <div className="w-64 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
          <div className="h-8 border-b border-zinc-800 flex items-center justify-between px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-900/50">
            <span>Explorer</span>
          </div>
          <div className="flex-grow overflow-y-auto py-2">
            {Object.keys(files).map((filename) => {
              const isUntouched = files[filename] === INITIAL_FILES[filename];

              return (
              <div
                key={filename}
                onClick={() => {
                  setActiveFile(filename);
                  setPreviewMode("single");
                }}
                className={cn(
                  "flex items-center justify-between px-6 py-1.5 cursor-pointer text-sm font-mono transition-colors border-l-2",
                  activeFile === filename && previewMode === "single"
                    ? "bg-indigo-500/10 text-indigo-300 border-indigo-500"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border-transparent"
                )}
              >
                <div className="flex items-center gap-2">
                  <FileCode2 size={14} className={activeFile === filename && previewMode === "single" ? "text-indigo-400" : "text-zinc-500"} />
                  {filename}
                </div>
                {isUntouched && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-[8px] px-1 py-0 border-none h-4">NEW</Badge>
                )}
              </div>
            )})}
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
              language={activeFile.endsWith(".tsx") || activeFile.endsWith(".ts") ? "typescript" : "javascript"}
              theme="vs-dark"
              value={files[activeFile]}
              onChange={handleEditorChange}
              beforeMount={handleEditorWillMount}
              options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: "on", formatOnPaste: true, padding: { top: 16 }, fontFamily: "JetBrains Mono, monospace" }}
            />
            {compileError && (
              <div className="absolute bottom-4 left-4 right-4 bg-red-950/90 border border-red-500/50 p-3 rounded-lg shadow-xl backdrop-blur-md z-10">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
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
              <UIButton size="sm" variant="ghost" className={cn("h-7 px-3 text-xs", previewMode === "single" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white")} onClick={() => setPreviewMode("single")}>
                <LayoutTemplate size={14} className="mr-1.5" /> Component
              </UIButton>
              <UIButton size="sm" variant="ghost" className={cn("h-7 px-3 text-xs", previewMode === "full" ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "text-zinc-400 hover:text-white")} onClick={() => setPreviewMode("full")}>
                <Layers size={14} className="mr-1.5" /> Full Page
              </UIButton>
            </div>
            <UIButton size="sm" variant="ghost" className="h-8 text-zinc-400 hover:text-white" onClick={handleCompileAndRun}>
              <Play size={14} className="mr-1.5" /> Refresh
            </UIButton>
          </div>

          <div className={cn("flex flex-col min-h-0 relative transition-all duration-300", previewMode === "single" ? "flex-1 border-b border-zinc-800" : "h-full")}>
            <div className="flex-grow bg-zinc-950/50 relative overflow-hidden flex items-center justify-center p-4">
              
              {/* 🚀 THE REAL ROUTE IFRAME */}
              <iframe
                ref={iframeRef}
                src={`/studio-preview?portfolioId=${selectedTestSiteId || ''}`}
                className={cn(
                  "bg-white border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-500",
                  previewMode === "full" ? "w-full h-full rounded-md" : "w-full max-w-2xl h-[500px] rounded-xl"
                )}
                title="Live Sandbox"
                // allow-scripts is sufficient when pointing to a local route
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
                      <UILabel className="text-xs text-zinc-300 font-bold uppercase tracking-wider">
                        {field.label}
                      </UILabel>

                      {field.type === "string" && (
                        <UIInput
                          value={mockData[key] || ""}
                          onChange={(e) => handlePropChange(key, e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-sm h-9 text-zinc-100"
                        />
                      )}

                      {field.type === "toggle" && (
                        <div className="flex items-center h-9">
                          <input type="checkbox" checked={mockData[key] !== undefined ? mockData[key] : field.default || false} onChange={(e) => handlePropChange(key, e.target.checked)} className="w-4 h-4 cursor-pointer" />
                        </div>
                      )}

                      {field.type === "select" && (
                        <select
                          value={mockData[key] || field.default}
                          onChange={(e) => handlePropChange(key, e.target.value)}
                          className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm shadow-sm transition-colors text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                        >
                          {field.options?.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {field.type === "color" && (
                        <div className="flex items-center gap-3">
                          <input type="color" value={mockData[key] || "#000000"} onChange={(e) => handlePropChange(key, e.target.value)} className="w-8 h-8 rounded border border-zinc-700 cursor-pointer p-0" />
                          <UIInput value={mockData[key] || ""} onChange={(e) => handlePropChange(key, e.target.value)} className="bg-zinc-950 border-zinc-800 font-mono text-xs h-9 uppercase text-zinc-100" />
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

      <SdkDocsModal isOpen={isDocsOpen} onOpenChange={setIsDocsOpen} />
    </div>
  );
}