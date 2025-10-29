// In src/components/VoiceNoteRecorder.tsx

import React, { useState, useRef } from 'react';
import { Mic, StopCircle, Send, Trash2 } from 'lucide-react';

interface VoiceNoteRecorderProps {
  onSend: (audioFile: File) => void;
  onCancel: () => void;
}

// --- Helper to find supported MIME type ---
const getSupportedMimeType = (): { mimeType: string; extension: string } => {
  const typesToCheck = [
    { mimeType: 'audio/mp4', extension: 'mp4' }, // Often uses AAC codec, good compatibility
    { mimeType: 'audio/aac', extension: 'aac' }, // Good compatibility, especially iOS
    { mimeType: 'audio/webm;codecs=opus', extension: 'webm' }, // Good quality, widely supported modern
    { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' }, // Alternative
    { mimeType: 'audio/webm', extension: 'webm' }, // Fallback
  ];

  for (const typeInfo of typesToCheck) {
    if (MediaRecorder.isTypeSupported(typeInfo.mimeType)) {
      console.log(`Using supported MIME type: ${typeInfo.mimeType}`);
      return typeInfo;
    }
  }

  console.warn("No preferred MIME type supported, using browser default.");
  // Fallback to empty strings, MediaRecorder might choose a default
  return { mimeType: typesToCheck[typesToCheck.length - 1].mimeType, extension: typesToCheck[typesToCheck.length - 1].extension };
};
// --- End Helper ---


const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // Store the chosen format details
  const recordingFormatRef = useRef<{ mimeType: string; extension: string } | null>(null);


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // --- Determine supported MIME type ---
      const format = getSupportedMimeType();
      recordingFormatRef.current = format; // Store it
      // --- End Determine ---

      // --- Pass options to MediaRecorder ---
      const options = { mimeType: format.mimeType };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      // --- End Pass options ---

      audioChunksRef.current = []; // Clear previous chunks

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        if (!recordingFormatRef.current) return; // Should not happen

        // --- Use stored format info ---
        const audioBlob = new Blob(audioChunksRef.current, { type: recordingFormatRef.current.mimeType });
        const audioFile = new File(
            [audioBlob],
            `voice-note-${Date.now()}.${recordingFormatRef.current.extension}`, // Use correct extension
            { type: recordingFormatRef.current.mimeType }
        );
        // --- End Use stored format ---
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setAudioFile(audioFile);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      // --- Improved Error Alert ---
       if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
          alert("Microphone access denied. Please allow microphone permissions in your browser settings for this site.");
       } else if (err instanceof Error && err.name === 'NotFoundError') {
          alert("No microphone found. Please ensure a microphone is connected and enabled.");
       } else {
          alert(`Could not start recording. Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
       }
      // --- End Improved Alert ---
    }
  };

  // ... (stopRecording, handleSend, handleCancel remain the same) ...
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
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
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setAudioFile(null);
    setAudioURL(null);
    setIsRecording(false);
    onCancel();
  };


  // --- JSX remains the same ---
  return (
    <div className="flex items-center w-full gap-2 p-4 border-t border-slate-700">
      {!audioURL ? (
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