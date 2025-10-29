// In src/components/RecordingModal.tsx
import React, { useState, useRef } from 'react';
import { Mic, StopCircle, Play, Save, X } from 'lucide-react';

interface RecordingModalProps {
  onClose: () => void;
  onSave: (audioFile: File, recordingName: string) => void;
  isSaving: boolean;
}

const RecordingModal: React.FC<RecordingModalProps> = ({ onClose, onSave, isSaving }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recordingName, setRecordingName] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      setAudioFile(null);
      setAudioURL(null);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setAudioFile(file);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleSaveClick = () => {
    if (audioFile && recordingName.trim()) {
      onSave(audioFile, recordingName.trim());
    } else {
      alert("Please provide a name for your recording.");
    }
  };

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
              disabled={!audioFile}
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