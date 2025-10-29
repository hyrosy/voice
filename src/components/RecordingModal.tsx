// In src/components/RecordingModal.tsx
import React, { useState, useRef } from 'react';
import { Mic, StopCircle, Play, Save, X } from 'lucide-react'; // Ensure Play is imported if needed elsewhere, not used here directly

interface RecordingModalProps {
  onClose: () => void;
  onSave: (audioFile: File, recordingName: string) => void;
  isSaving: boolean;
}

// --- Re-use the same Helper ---
const getSupportedMimeType = (): { mimeType: string; extension: string } => {
  const typesToCheck = [
    { mimeType: 'audio/mp4', extension: 'mp4' },
    { mimeType: 'audio/aac', extension: 'aac' },
    { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
    { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
    { mimeType: 'audio/webm', extension: 'webm' },
  ];
  for (const typeInfo of typesToCheck) {
    if (MediaRecorder.isTypeSupported(typeInfo.mimeType)) {
      console.log(`Using supported MIME type: ${typeInfo.mimeType}`);
      return typeInfo;
    }
  }
  console.warn("No preferred MIME type supported, using browser default.");
  return { mimeType: typesToCheck[typesToCheck.length - 1].mimeType, extension: typesToCheck[typesToCheck.length - 1].extension };
};
// --- End Helper ---

const RecordingModal: React.FC<RecordingModalProps> = ({ onClose, onSave, isSaving }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recordingName, setRecordingName] = useState('');
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

      audioChunksRef.current = [];
      setAudioFile(null); // Clear previous file/URL
      setAudioURL(null);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        if (!recordingFormatRef.current) return;

        // --- Use stored format info ---
        const audioBlob = new Blob(audioChunksRef.current, { type: recordingFormatRef.current.mimeType });
        const file = new File(
          [audioBlob],
          `recording-${Date.now()}.${recordingFormatRef.current.extension}`, // Use correct extension
          { type: recordingFormatRef.current.mimeType }
        );
        // --- End Use stored format ---
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setAudioFile(file);
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

  // ... (stopRecording and handleSaveClick remain the same) ...
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleSaveClick = () => {
    if (audioFile && recordingName.trim()) {
      // Create a new File object with the user-provided name but correct extension and type
      const finalFile = new File(
          [audioFile], // Use the blob data from the existing file
          `${recordingName.trim()}.${recordingFormatRef.current?.extension || 'bin'}`, // New name + correct extension
          { type: recordingFormatRef.current?.mimeType || audioFile.type } // Correct MIME type
      );
      onSave(finalFile, recordingName.trim()); // Send the renamed file
    } else if (!recordingName.trim()) {
      alert("Please provide a name for your recording.");
    }
  };


  // --- JSX remains the same ---
   return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700/50 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Record New Audio</h2>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-full text-white flex items-center justify-center transition-colors ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isRecording ? <StopCircle size={32} /> : <Mic size={32} />}
          </button>

          <p className="text-slate-400 text-sm h-5">
            {isRecording ? 'Recording...' : (audioURL ? 'Preview recording' : 'Click to start recording')}
          </p>

          {audioURL && (
            <audio src={audioURL} controls className="w-full h-10 my-2" />
          )}

          <div className="w-full space-y-4 pt-4 border-t border-slate-700">
            <input
              type="text"
              value={recordingName}
              onChange={(e) => setRecordingName(e.target.value)}
              placeholder="Recording Name (e.g., 'Audition Take 1')"
              className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-white"
              disabled={!audioFile} // Disable if no recording exists
            />
            <button
              onClick={handleSaveClick}
              disabled={!audioFile || !recordingName.trim() || isSaving}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save to Library'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingModal;