import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/supabaseClient";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Session {
  id: string;
  title: string;
}

export function AdminChatSheet() {
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth Hook
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // History Hooks
  useEffect(() => {
    if (isOpen) fetchSessions();
  }, [isOpen]);

  useEffect(() => {
    if (activeSessionId) fetchMessages(activeSessionId);
  }, [activeSessionId]);

  // --- FUNCTIONS ---
  const fetchSessions = async () => {
    const { data } = await supabase
      .from("admin_ai_sessions")
      .select("*")
      .order("created_at", { ascending: false });
    if (data && data.length > 0) {
      setSessions(data);
      // 🚀 FIX: Auto-select the most recent chat if none is selected!
      if (!activeSessionId) setActiveSessionId(data[0].id);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    const { data } = await supabase
      .from("admin_ai_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const createNewChat = async (customTitle?: string) => {
    const { data } = await supabase
      .from("admin_ai_sessions")
      .insert({ admin_id: user.id, title: customTitle || "New Debug Session" })
      .select()
      .single();
    if (data) {
      setSessions((prev) => [data, ...prev]);
      setActiveSessionId(data.id);
      setMessages([]);
      return data.id;
    }
    return null;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput("");

    // Optimistically show user message
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: userMsg },
    ]);
    setIsLoading(true);

    // 🚀 FIX: Auto-create a chat session on-the-fly if one doesn't exist yet!
    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      targetSessionId = await createNewChat(
        "Chat: " + userMsg.substring(0, 15) + "..."
      );
      if (!targetSessionId) {
        setIsLoading(false);
        return; // Failed to create session
      }
    }

    const currentPage = window.location.pathname;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(
        "https://eaebtyjhoogzjhbzdvdy.supabase.co/functions/v1/admin-chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            session_id: targetSessionId,
            message: userMsg,
            context: { page: currentPage },
          }),
        }
      );

      const result = await response.json();

      // 🚀 FIX: Catch empty or missing text from the edge function so it doesn't render invisible bubbles
      const finalReply =
        result.reply ||
        result.error ||
        "⚠️ Empty response received from AI. Check Edge Function logs.";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: String(finalReply),
        },
      ]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `⚠️ Network Error: ${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File attached:", file.name);
    }
  };

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  if (isAuthChecking || !user || user.email !== "support@hyrosy.com") {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50">
          <Bot size={28} />
        </Button>
      </SheetTrigger>

      <SheetContent
        className={`p-0 flex transition-all duration-300 ${
          isExpanded ? "w-full sm:max-w-[1200px]" : "w-full sm:max-w-[500px]"
        }`}
      >
        {isExpanded && (
          <div className="w-[300px] border-r bg-muted/30 p-4 flex flex-col">
            <Button onClick={() => createNewChat()} className="mb-4">
              <Plus className="mr-2 h-4 w-4" /> New Chat
            </Button>
            <ScrollArea className="flex-1">
              {sessions.map((s) => (
                <Button
                  key={s.id}
                  variant={activeSessionId === s.id ? "secondary" : "ghost"}
                  className="w-full justify-start mb-1"
                  onClick={() => setActiveSessionId(s.id)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" /> {s.title}
                </Button>
              ))}
            </ScrollArea>
          </div>
        )}

        <div className="flex-1 flex flex-col h-full">
          <SheetHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
            <SheetTitle className="flex items-center gap-2">
              <Bot className="text-primary" /> Co-pilot
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </Button>
          </SheetHeader>

          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground mt-20">
                Start typing below to begin a new chat!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-4 flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Moved the text-sm space-y-2 break-words classes up here! */}
                  <div
                    className={`p-3 rounded-lg max-w-[85%] text-sm space-y-2 break-words ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {/* Removed className from here */}
                    <ReactMarkdown
                      components={{
                        code({ node, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          return match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code
                              className="bg-muted-foreground/20 px-1 py-0.5 rounded font-mono"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>

                    {msg.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-6 px-2 text-xs opacity-50 hover:opacity-100"
                        onClick={() => speakText(msg.content)}
                      >
                        <Volume2 size={12} className="mr-1" /> Read Aloud
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="text-muted-foreground text-sm flex items-center gap-2 mt-4">
                <Bot size={14} className="animate-bounce" /> Thinking...
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t flex items-center gap-2 bg-background">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.txt"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={18} />
            </Button>
            <Input
              placeholder="Ask about the codebase, database, or current page..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={isLoading} // 🚀 FIX: You can now type even if no chat is active!
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Send size={18} />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
