// In src/components/ChatBox.tsx

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Send, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  created_at: string;
  sender_role: 'client' | 'actor';
  content: string;
}

interface ChatBoxProps {
  orderId: string;
  userRole: 'client' | 'actor'; // To know who is sending the message
}

const ChatBox: React.FC<ChatBoxProps> = ({ orderId, userRole }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    // Function to scroll to the bottom of the chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

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

    // **REAL-TIME MAGIC**: Subscribe to new messages
    useEffect(() => {
        const channel = supabase.channel(`messages-for-${orderId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${orderId}` },
                (payload) => {
                    setMessages(currentMessages => [...currentMessages, payload.new as Message]);
                }
            )
            .subscribe();

        // Cleanup subscription on component unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [orderId]);
    
    // Scroll to bottom when new messages arrive
    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const { error } = await supabase
            .from('messages')
            .insert({
                order_id: orderId,
                sender_role: userRole,
                content: newMessage.trim(),
            });
        
        if (error) console.error("Error sending message:", error);
        else setNewMessage(''); // Clear input on success
    };

    return (
        <div className="bg-slate-900/70 rounded-lg border border-slate-700 mt-8">
            <div className="p-4 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><MessageSquare size={20}/> Communication</h2>
            </div>
            <div className="p-4 h-64 overflow-y-auto">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex mb-3 ${msg.sender_role === userRole ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg px-4 py-2 max-w-xs ${msg.sender_role === userRole ? 'bg-blue-600' : 'bg-slate-600'}`}>
                            <p className="text-white">{msg.content}</p>
                            <p className="text-xs text-slate-300 text-right mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-slate-700">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow bg-slate-700 border border-slate-600 rounded-lg p-3 text-white"
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg flex items-center justify-center">
                        <Send size={20}/>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatBox;