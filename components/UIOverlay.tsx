import React, { useState, useRef } from 'react';
import { ThemeType, THEMES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { initAudio, setMute, playSound } from '../utils/audio';
import { Volume2, VolumeX, Video, StopCircle, Palette } from 'lucide-react';

interface UIOverlayProps {
  currentTheme: ThemeType;
  setTheme: (t: ThemeType) => void;
  recorderStream: MediaStream | null;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ currentTheme, setTheme, recorderStream }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleMute = () => {
    initAudio();
    const newState = !isMuted;
    setIsMuted(newState);
    setMute(newState);
  };

  const startRecording = () => {
    if (!recorderStream) return;
    initAudio();
    playSound('POP');
    chunksRef.current = [];
    try {
        const recorder = new MediaRecorder(recorderStream, { mimeType: 'video/webm' });
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `multiverse-garden-${Date.now()}.webm`;
            a.click();
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);

        // Auto stop after 6 seconds
        setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                stopRecording();
            }
        }, 6000);

    } catch (e) {
        console.error("Recording failed", e);
        alert("Recording not supported on this device/browser configuration.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        playSound('SHIMMER');
    }
  };

  const themeColors = THEMES[currentTheme];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="text-white">
            <h1 className="text-2xl font-bold tracking-tight drop-shadow-md">Multiverse Garden</h1>
            <p className="text-xs opacity-70">Touch the world to shape it</p>
        </div>
        
        <div className="flex gap-3">
            <button 
                onClick={() => setShowThemes(!showThemes)}
                className="p-3 rounded-full backdrop-blur-md bg-white/20 hover:bg-white/30 transition-colors shadow-lg text-white"
            >
                <Palette size={20} />
            </button>
            <button 
                onClick={handleMute}
                className="p-3 rounded-full backdrop-blur-md bg-white/20 hover:bg-white/30 transition-colors shadow-lg text-white"
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
        </div>
      </div>

      {/* Theme Selector */}
      <AnimatePresence>
        {showThemes && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-20 right-6 flex flex-col gap-2 pointer-events-auto"
            >
                {Object.values(ThemeType).map((t) => (
                    <button
                        key={t}
                        onClick={() => {
                            setTheme(t);
                            playSound('POP');
                            setShowThemes(false);
                        }}
                        className="px-4 py-2 rounded-lg backdrop-blur-md bg-black/40 text-white text-sm font-medium hover:bg-white/20 transition-all border border-white/10 text-right"
                    >
                        {t.replace('_', ' ')}
                    </button>
                ))}
            </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Controls */}
      <div className="flex justify-center items-end pb-8 pointer-events-auto">
         <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`
                flex items-center gap-2 px-6 py-3 rounded-full font-semibold shadow-xl transition-all transform hover:scale-105 active:scale-95
                ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 backdrop-blur-lg text-white border border-white/30'}
            `}
         >
            {isRecording ? <StopCircle size={20} /> : <Video size={20} />}
            <span>{isRecording ? 'Recording...' : 'Record Clip'}</span>
         </button>
      </div>

      {/* Instructions Overlay (Fades out) */}
      <motion.div 
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 5, duration: 2 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
         <div className="text-center text-white/80 space-y-2 bg-black/20 p-6 rounded-2xl backdrop-blur-sm">
            <p>Tap Sky for Orbs</p>
            <p>Tap Ground for Life</p>
            <p>Tap Water to Freeze</p>
            <p>Double Tap to Explode</p>
         </div>
      </motion.div>
    </div>
  );
};

export default UIOverlay;
