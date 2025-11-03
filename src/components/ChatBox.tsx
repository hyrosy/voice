// In src/components/ChatBox.tsx

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Send, Mic } from 'lucide-react';
import VoiceNoteRecorder from './VoiceNoteRecorder';

// --- shadcn/ui Imports ---
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
// ---

interface Message {
  id: string;
  created_at: string;
  sender_role: 'client' | 'actor';
  content: string;
}

interface ChatBoxProps {
  orderId: string;
  userRole: 'client' | 'actor';
}

const ChatBox: React.FC<ChatBoxProps> = ({ orderId, userRole }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    // --- THIS IS THE FIX ---
    // We use a ref for an empty div at the end of the message list
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // This function scrolls the messagesEndRef into view
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    // --- END FIX ---

    // Fetch initial messages
    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('order_id', orderId)
                .order('created_at', { ascending: true });
            
            if (error) console.error("Error fetching messages:", error);
            else setMessages(data || []);
        };
        fetchMessages();
    }, [orderId]);

    // Real-time subscription
    useEffect(() => {
        const channel = supabase.channel(`messages-for-${orderId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${orderId}` },
                (payload) => {
                    setMessages(currentMessages => [...currentMessages, payload.new as Message]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orderId]);
    
    // Scroll to bottom when new messages arrive
    useEffect(() => {
        // Give a slight delay for the new message to render
        setTimeout(scrollToBottom, 100);
    }, [messages]);

    // handleSendMessage (no changes needed)
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setIsLoading(true);
        const contentToSend = newMessage.trim();
        setNewMessage('');
        await supabase
            .from('messages')
            .insert({
                order_id: orderId,
                sender_role: userRole,
                content: contentToSend,
            });  
        setIsLoading(false);
    };

    // handleSendVoiceNote (no changes needed)
    const handleSendVoiceNote = async (audioFile: File) => {
        setIsLoading(true);
        setIsRecording(false);
        try {
            const fileExt = audioFile.name.split('.').pop() || 'webm';
            const filePath = `${orderId}/${userRole}-${Date.now()}.${fileExt}`;
            await supabase.storage.from('voice-notes').upload(filePath, audioFile);
            const { data: urlData } = supabase.storage.from('voice-notes').getPublicUrl(filePath);
            if (!urlData) throw new Error("Could not get public URL for voice note.");
            await supabase
                .from('messages')
                .insert({
                    order_id: orderId,
                    sender_role: userRole,
                    content: `[VOICE_NOTE]:${urlData.publicUrl}` 
                });
        } catch (error) {
            console.error("Error sending voice note:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[450px]">
            {/* ScrollArea wraps the message list */}
            <ScrollArea className="flex-grow p-4">
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender_role === userRole ? 'justify-end' : 'justify-start'}`}>
                            <div className={`rounded-lg px-4 py-2 max-w-[80%]
                                ${msg.sender_role === userRole 
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                {msg.content.startsWith('[VOICE_NOTE]:') ? (
                                <audio
                                    controls
                                    src={msg.content.replace('[VOICE_NOTE]:', '')}
                                    className="h-10 w-full min-w-[200px]" // <-- THIS IS THE FIX
                                />
                            ) : (
                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                )}
                                <p className={`text-xs text-right mt-1 ${msg.sender_role === userRole ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                                  {new Date(msg.created_at).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    ))}
                    {/* This empty div is our scroll target */}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>
            
            {/* Conditional Input Area (no changes needed) */}
            {isRecording ? (
                <VoiceNoteRecorder 
                    onSend={handleSendVoiceNote} 
                    onCancel={() => setIsRecording(false)} 
                />
            ) : (
                <div className="flex-shrink-0 p-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            disabled={isLoading}
                        />
                        <Button 
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsRecording(true)}
                            disabled={isLoading}
                        >
                            <Mic className="h-4 w-4" />
                        </Button>
                        <Button 
                            type="submit"
                            size="icon"
                            disabled={isLoading || !newMessage.trim()}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatBox;