// In src/components/VoiceNoteRecorder.tsx

import React, { useState, useRef } from 'react';
import { Mic, StopCircle, Send, Trash2 } from 'lucide-react';

interface VoiceNoteRecorderProps {
  onSend: (audioFile: File) => void;
  onCancel: () => void;
}

const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = []; // Clear previous chunks

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
            type: 'audio/webm'
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setAudioFile(audioFile);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied. Please allow microphone permissions in your browser settings.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // Stop all tracks on the stream to turn off the mic indicator
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    if (audioFile) {
      onSend(audioFile);
    }
  };

  const handleCancel = () => {
    // Stop recording if active and clean up
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setAudioFile(null);
    setAudioURL(null);
    setIsRecording(false);
    onCancel(); // Call parent's cancel function
  };

  return (
    <div className="flex items-center w-full gap-2 p-4 border-t border-slate-700">
      {!audioURL ? (
        // --- Recording View ---
        <>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-full text-white transition-colors ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
          </button>
          <div className="flex-grow text-sm text-slate-400">
            {isRecording ? "Recording... Click to stop." : "Click the mic to record a voice note."}
          </div>
          <button onClick={handleCancel} className="p-3 text-slate-400 hover:text-white">
            Cancel
          </button>
        </>
      ) : (
        // --- Playback View ---
        <>
          <audio src={audioURL} controls className="flex-grow h-10" />
          <button onClick={handleCancel} className="p-3 text-red-500 hover:text-red-400 rounded-full bg-slate-700">
            <Trash2 size={20} />
          </button>
          <button onClick={handleSend} className="p-3 text-white bg-blue-600 hover:bg-blue-700 rounded-full">
            <Send size={20} />
          </button>
        </>
      )}
    </div>
  );
};

export default VoiceNoteRecorder;