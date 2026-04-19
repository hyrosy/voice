import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/supabaseClient";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription, // 🚀 ADD THIS
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Maximize2,
  Minimize2,
  Paperclip,
  Send,
  Volume2,
  Plus,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner"; // Assuming sonner for notifications

export function AdminChatSheet() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 1. AUTH CHECK
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // 2. AUTO-SCROLL (Smooth scroll to the invisible bottom div)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // 3. LOAD DATA
  useEffect(() => {
    if (isOpen) fetchSessions();
  }, [isOpen]);

  useEffect(() => {
    if (activeSessionId) fetchMessages(activeSessionId);
  }, [activeSessionId]);

  const fetchSessions = async () => {
    const { data } = await supabase
      .from("admin_ai_sessions")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSessions(data);
  };

  const fetchMessages = async (sid: string) => {
    const { data } = await supabase
      .from("admin_ai_messages")
      .select("*")
      .eq("session_id", sid)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput("");
    setIsLoading(true);

    let sid = activeSessionId;
    if (!sid) {
      const { data: newSess } = await supabase
        .from("admin_ai_sessions")
        .insert({ admin_id: user.id, title: msg.slice(0, 30) })
        .select()
        .single();
      if (newSess) {
        sid = newSess.id;
        setActiveSessionId(sid);
        setSessions([newSess, ...sessions]);
      }
    }

    // Optimistic UI
    setMessages((prev) => [...prev, { role: "user", content: msg }]);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(
        "https://eaebtyjhoogzjhbzdvdy.supabase.co/functions/v1/admin-chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            session_id: sid,
            message: msg,
            context: { page: window.location.pathname },
          }),
        }
      );

      // 🚀 NEW: Catch server errors before trying to read JSON
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server returned ${res.status}: ${errorText}`);
      }

      const data = await res.json();

      // 🚀 NEW: Handle Google Cloud errors gracefully
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (e: any) {
      console.error("AI Fetch Error:", e);
      // 🚀 NEW: Print the actual error into the chat bubble!
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **Connection Error:** \n\n\`\`\`text\n${e.message}\n\`\`\``,
        },
      ]);
      toast.error("Failed to reach AI Co-pilot");
    } finally {
      setIsLoading(false); // This guarantees it will STOP spinning
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  if (user?.email !== "support@hyrosy.com") return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 bg-primary hover:scale-110 transition-transform">
          <Bot size={28} />
        </Button>
      </SheetTrigger>

      <SheetContent
        className={`p-0 flex transition-all duration-500 ease-in-out ${
          isExpanded ? "w-screen sm:max-w-full" : "w-full sm:max-w-[500px]"
        }`}
      >
        {isExpanded && (
          <aside className="w-[300px] border-r bg-muted/20 p-4 hidden md:flex flex-col">
            <Button
              variant="outline"
              className="w-full mb-4 border-dashed"
              onClick={() => {
                setActiveSessionId(null);
                setMessages([]);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> New Session
            </Button>
            <ScrollArea className="flex-1">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSessionId(s.id)}
                  className={`w-full text-left p-3 rounded-md mb-1 text-sm transition-colors ${
                    activeSessionId === s.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted"
                  }`}
                >
                  <MessageSquare size={14} className="inline mr-2 opacity-50" />{" "}
                  {s.title}
                </button>
              ))}
            </ScrollArea>
          </aside>
        )}

        <div className="flex-1 flex flex-col bg-background">
          <header className="p-4 border-b flex items-center justify-between bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              {/* 🚀 FIX 1: Use SheetTitle instead of a span */}
              <SheetTitle className="font-bold tracking-tight m-0 text-base">
                System Architect AI
              </SheetTitle>
            </div>{" "}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </Button>
          </header>
          {/* 🚀 FIX 2: Add a hidden description for Screen Readers to satisfy the second warning */}
          <SheetDescription className="sr-only">
            AI Co-pilot interface for navigating database and codebase
            architecture.
          </SheetDescription>
          <ScrollArea className="flex-1 p-6">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`mb-6 flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`group relative p-4 rounded-2xl max-w-[90%] shadow-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted border"
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      code({
                        node,
                        inline,
                        className,
                        children,
                        ...props
                      }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <div className="relative mt-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute right-2 top-2 h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => copyCode(String(children))}
                            >
                              <Copy size={14} />
                            </Button>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-lg !mt-0 shadow-inner"
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code
                            className="bg-primary/20 px-1.5 py-0.5 rounded font-mono text-xs"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                  {m.role === "assistant" && (
                    <button
                      onClick={() =>
                        window.speechSynthesis.speak(
                          new SpeechSynthesisUtterance(m.content)
                        )
                      }
                      className="mt-3 opacity-0 group-hover:opacity-50 transition-opacity flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest"
                    >
                      <Volume2 size={10} /> Read Response
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
                <Bot size={18} className="animate-bounce" />
                <span className="text-sm italic">Synthesizing solution...</span>
              </div>
            )}
            {/* 🚀 ADD THIS DUMMY DIV HERE */}
            <div ref={messagesEndRef} />
          </ScrollArea>

          <footer className="p-4 border-t bg-muted/30">
            <div className="flex gap-2 items-center bg-background p-2 rounded-xl border shadow-sm focus-within:ring-2 ring-primary/20 transition-all">
              {/* 1. ADD THE HIDDEN FILE INPUT BACK */}
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/*,.pdf,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) toast.success(`Attached: ${file.name}`);
                }}
              />
              {/* 2. MAKE THE PAPERCLIP TRIGGER IT */}
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 hover:text-primary"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Paperclip size={20} />
              </Button>

              <Input
                placeholder="Ask anything..."
                className="border-0 focus-visible:ring-0 px-2"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) handleSend();
                }}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="shrink-0 rounded-lg"
              >
                <Send size={18} />
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-2 uppercase tracking-tighter opacity-50">
              Super Admin Mode Active • Authorized Access Only
            </p>
          </footer>
        </div>
      </SheetContent>
    </Sheet>
  );
}
