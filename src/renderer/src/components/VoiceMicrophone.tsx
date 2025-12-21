import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';

interface VoiceMicrophoneProps {
  isListening: boolean;
  transcript: string;
  onToggleListening: () => void;
  verificationStatus?: 'idle' | 'verifying' | 'success' | 'failed';
}

const VoiceMicrophone: React.FC<VoiceMicrophoneProps> = ({
  isListening,
  transcript,
  onToggleListening,
  verificationStatus
}) => {
  const [audioLevel, setAudioLevel] = useState(0);

  // Simulate audio level animation while listening
  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
      return undefined;
    }
  }, [isListening]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-8"
    >
      {/* Greeting Text */}
      {!isListening && !transcript && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-4">
            How can I help you today?
          </h1>
          <p className="text-gray-400 text-lg">
            Click the microphone to start speaking
          </p>
        </motion.div>
      )}

      {/* Visualizer Container */}
      <div className="relative flex items-center justify-center">
        {/* Animated Rings when listening */}
        {isListening && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border-2 border-green-400/30"
                initial={{ width: 80, height: 80, opacity: 0 }}
                animate={{
                  width: 80 + (i + 1) * 60,
                  height: 80 + (i + 1) * 60,
                  opacity: [0, 0.5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: 'easeOut'
                }}
              />
            ))}
          </>
        )}

        {/* Audio Visualizer Bars */}
        {isListening && (
          <div className="absolute flex items-center justify-center gap-1.5">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-gradient-to-t from-green-400 to-blue-500 rounded-full"
                animate={{
                  height: [20, Math.random() * 60 + 20, 20]
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        )}

        {/* Microphone Button */}
        <motion.button
          onClick={onToggleListening}
          className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all ${isListening
            ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            : 'bg-gradient-to-br from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600'
            }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={isListening ? { scale: [1, 1.05, 1] } : {}}
          transition={isListening ? { duration: 1, repeat: Infinity } : {}}
        >
          {isListening ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </motion.button>
      </div>

      {/* Live Transcript Display */}
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 max-w-2xl"
        >
          <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
            <p className="text-gray-300 text-lg text-center leading-relaxed">
              {transcript}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            {isListening ? (
              <p className="text-center text-gray-400 text-sm">Listening...</p>
            ) : verificationStatus === 'verifying' ? (
              <>
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <p className="text-center text-yellow-400 text-sm">Verifying Voice...</p>
              </>
            ) : null}
          </div>
        </motion.div>
      )}

      {/* Instructions */}
      {!isListening && !transcript && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-6 text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Click to speak</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">Click to stop</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VoiceMicrophone;
