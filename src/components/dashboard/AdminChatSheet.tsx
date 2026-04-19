import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/supabaseClient";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
  TerminalSquare,
  Trash2,
  Mic, // 🚀 NEW: Microphone Icon
  MicOff, // 🚀 NEW: Mic Off Icon
  Play, // 🚀 NEW
  Pause, // 🚀 NEW
  Square, // 🚀 NEW
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";

export function AdminChatSheet() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 🚀 NEW: Voice Dictation States
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 🚀 NEW: Playback States
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setSpeakingIndex(null);
    setIsSpeechPaused(false);
  };
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages, isLoading, isExpanded]);

  useEffect(() => {
    if (isOpen) fetchSessions();
  }, [isOpen]);

  useEffect(() => {
    if (activeSessionId) fetchMessages(activeSessionId);
  }, [activeSessionId]);
  useEffect(() => {
    // Stop reading if the user closes the panel
    if (!isOpen) stopSpeech();
  }, [isOpen]);
  const fetchSessions = async () => {
    const { data } = await supabase
      .from("admin_ai_sessions")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setSessions(data);
      if (!activeSessionId && data.length > 0) setActiveSessionId(data[0].id);
    }
  };

  const fetchMessages = async (sid: string) => {
    const { data } = await supabase
      .from("admin_ai_messages")
      .select("*")
      .eq("session_id", sid)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
  };

  const handleDeleteSession = async (
    e: React.MouseEvent,
    sessionId: string
  ) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
    }
    try {
      await supabase
        .from("admin_ai_messages")
        .delete()
        .eq("session_id", sessionId);
      const { error } = await supabase
        .from("admin_ai_sessions")
        .delete()
        .eq("id", sessionId);
      if (error) throw error;
      toast.success("Chat session deleted");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete chat");
      fetchSessions();
    }
  };

  // 🚀 NEW: Voice Dictation Logic
  const toggleDictation = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(
        "Your browser doesn't support voice dictation. Try Google Chrome."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stops automatically when you pause
    recognition.interimResults = true; // Shows text in real-time

    const originalInput = input; // Save whatever was already typed

    recognition.onresult = (event: any) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      setInput(originalInput + (originalInput ? " " : "") + currentTranscript);
    };

    recognition.onerror = (e: any) => {
      console.error("Detailed Speech Error:", e.error);
      setIsListening(false);

      if (e.error === "not-allowed") {
        toast.error(
          "Microphone blocked! Please click the padlock in your URL bar to allow access."
        );
      } else if (e.error === "network") {
        toast.error(
          "Network error. Speech recognition requires HTTPS/localhost."
        );
      } else if (e.error === "no-speech") {
        toast.error("No speech detected. Microphone might be muted.");
      } else {
        toast.error(`Mic error: ${e.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
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
        .insert({ admin_id: user.id, title: msg.slice(0, 30) + "..." })
        .select()
        .single();
      if (newSess) {
        sid = newSess.id;
        setActiveSessionId(sid);
        setSessions([newSess, ...sessions]);
      }
    }

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

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server returned ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (e: any) {
      console.error("AI Fetch Error:", e);

      let cleanErrorMessage = e.message;

      // 🚀 Graceful Error Interceptors
      if (
        cleanErrorMessage.includes("429") ||
        cleanErrorMessage.includes("RESOURCE_EXHAUSTED")
      ) {
        cleanErrorMessage =
          "⚠️ **Rate Limit Reached:** The AI has exhausted its current Google Cloud quota. Please wait a minute before sending another message, or check your GCP billing limits.";
      } else if (
        cleanErrorMessage.includes("403") &&
        cleanErrorMessage.includes("Unauthorized")
      ) {
        cleanErrorMessage =
          "⚠️ **Access Denied:** Your session expired or you are not logged in with the authorized admin account.";
      } else {
        // Fallback for unknown errors
        cleanErrorMessage = `⚠️ **System Error:** \n\n\`\`\`text\n${cleanErrorMessage}\n\`\`\``;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: cleanErrorMessage,
        },
      ]);
      toast.error("AI Co-pilot encountered an issue");
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  if (user?.email !== "support@hyrosy.com") return null;
  // 🚀 NEW: Smart Voice Selector
  // 🚀 UPGRADED: Smart Voice Controller
  const toggleSpeech = (text: string, index: number) => {
    const synth = window.speechSynthesis;

    // 1. If clicking the same message that is currently active
    if (speakingIndex === index) {
      if (isSpeechPaused) {
        synth.resume();
        setIsSpeechPaused(false);
      } else {
        synth.pause();
        setIsSpeechPaused(true);
      }
      return;
    }

    // 2. If clicking a new message, stop anything currently playing
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const selectedVoice =
      voices.find((v) => v.name.includes("Google US English")) ||
      voices.find((v) => v.name.includes("Natural") && v.lang.includes("en")) ||
      voices.find((v) => v.name === "Samantha") ||
      voices.find((v) => v.lang === "en-US") ||
      voices.find((v) => v.lang.startsWith("en"));

    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // 3. Setup event listeners to reset UI when done
    utterance.onstart = () => {
      setSpeakingIndex(index);
      setIsSpeechPaused(false);
    };
    utterance.onend = () => {
      setSpeakingIndex(null);
      setIsSpeechPaused(false);
    };
    utterance.onerror = () => {
      setSpeakingIndex(null);
      setIsSpeechPaused(false);
    };

    synth.speak(utterance);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 bg-primary hover:scale-110 transition-transform">
          <Bot size={28} />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className={`p-0 flex gap-0 transition-all duration-500 ease-in-out border-l shadow-2xl ${
          isExpanded ? "!w-[95vw] !max-w-[1200px]" : "!w-[90vw] !max-w-[450px]"
        }`}
      >
        {isExpanded && (
          <aside className="w-[300px] border-r bg-muted/20 p-4 flex flex-col shrink-0 overflow-hidden">
            <Button className="w-full mb-4 shadow-sm" onClick={handleNewChat}>
              <Plus className="mr-2 h-4 w-4" /> New Session
            </Button>
            <ScrollArea className="flex-1 pr-3">
              <div className="space-y-1">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                      activeSessionId === s.id
                        ? "bg-primary text-primary-foreground font-medium shadow-sm"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setActiveSessionId(s.id)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare size={14} className="shrink-0" />
                      <span className="truncate">{s.title}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      className={`shrink-0 p-1 rounded hover:bg-destructive/90 hover:text-destructive-foreground transition-opacity ${
                        activeSessionId === s.id
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                      title="Delete chat"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </aside>
        )}

        <div className="flex-1 flex flex-col bg-background min-w-0">
          <header className="p-4 border-b flex items-center justify-between bg-background/80 backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <TerminalSquare size={16} />
              </div>
              <div>
                <SheetTitle className="font-bold tracking-tight m-0 text-base leading-none">
                  Bless
                </SheetTitle>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                    Co-Pilot
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-muted/50"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </Button>
          </header>

          <SheetDescription className="sr-only">
            AI Co-pilot interface.
          </SheetDescription>

          <ScrollArea className="flex-1 p-4 sm:p-6 relative">
            {messages.length === 0 && !isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50 text-center p-8">
                <Bot size={48} className="mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-lg">System Ready</h3>
                <p className="text-sm text-muted-foreground max-w-[250px] mt-2">
                  I have full access to your codebase and database. Ask me
                  anything.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`mb-6 flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`group relative p-4 rounded-2xl max-w-[90%] sm:max-w-[85%] shadow-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted/50 border rounded-bl-sm"
                  }`}
                >
                  <div className="text-sm leading-relaxed space-y-3">
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => (
                          <p className="mb-2 last:mb-0" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            className="list-disc pl-4 mb-2 space-y-1"
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            className="list-decimal pl-4 mb-2 space-y-1"
                            {...props}
                          />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="pl-1" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-semibold" {...props} />
                        ),
                        code({
                          node,
                          inline,
                          className,
                          children,
                          ...props
                        }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <div className="relative mt-3 mb-3 group/code">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover/code:opacity-100 transition-opacity z-10"
                                onClick={() => copyCode(String(children))}
                              >
                                <Copy size={12} />
                              </Button>
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-lg !mt-0 !bg-neutral-950 shadow-inner text-[13px] border border-neutral-800"
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code
                              className={`px-1.5 py-0.5 rounded font-mono text-[12px] ${
                                m.role === "user"
                                  ? "bg-primary-foreground/20"
                                  : "bg-primary/10 text-primary"
                              }`}
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
                  </div>

                  {m.role === "assistant" && (
                    <div className="mt-3 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleSpeech(m.content, i)}
                        className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {speakingIndex === i ? (
                          isSpeechPaused ? (
                            <>
                              <Play size={12} className="text-green-500" />{" "}
                              Resume
                            </>
                          ) : (
                            <>
                              <Pause size={12} className="text-amber-500" />{" "}
                              Pause
                            </>
                          )
                        ) : (
                          <>
                            <Volume2 size={12} /> Read Response
                          </>
                        )}
                      </button>

                      {/* Show the STOP button only if this specific message is playing or paused */}
                      {speakingIndex === i && (
                        <button
                          onClick={stopSpeech}
                          className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-red-400 hover:text-red-500 transition-colors"
                        >
                          <Square size={10} className="fill-current" /> Stop
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 text-muted-foreground mb-6 bg-muted/30 w-fit p-3 rounded-2xl rounded-bl-sm border">
                <div className="flex gap-1">
                  <div
                    className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="h-2 w-2 rounded-full bg-primary/80 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span className="text-xs font-medium">Synthesizing...</span>
              </div>
            )}
            <div ref={messagesEndRef} className="h-1" />
          </ScrollArea>

          <footer className="p-4 border-t bg-muted/10 shrink-0">
            <div className="flex gap-2 items-end bg-background p-2 rounded-2xl border shadow-sm focus-within:ring-2 ring-primary/20 transition-all">
              {/* 🚀 NEW: Voice Dictation Button */}
              <Button
                variant="ghost"
                size="icon"
                className={`shrink-0 mb-0.5 transition-colors ${
                  isListening
                    ? "text-red-500 bg-red-500/10 hover:text-red-600 hover:bg-red-500/20"
                    : "hover:text-primary"
                }`}
                onClick={toggleDictation}
                title={isListening ? "Stop listening" : "Dictate message"}
              >
                {isListening ? (
                  <MicOff size={18} className="animate-pulse" />
                ) : (
                  <Mic size={18} />
                )}
              </Button>

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
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 hover:text-primary mb-0.5"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Paperclip size={18} />
              </Button>

              <textarea
                placeholder="Ask anything about the architecture..."
                className="flex-1 bg-transparent border-0 focus:ring-0 resize-none min-h-[40px] max-h-[120px] py-2.5 px-2 text-sm text-foreground placeholder:text-muted-foreground"
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(
                    e.target.scrollHeight,
                    120
                  )}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="shrink-0 rounded-xl mb-0.5"
              >
                <Send size={16} />
              </Button>
            </div>
          </footer>
        </div>
      </SheetContent>
    </Sheet>
  );
}
