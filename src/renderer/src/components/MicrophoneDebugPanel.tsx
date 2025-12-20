import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, Mic, Check, AlertCircle } from 'lucide-react';

interface DebugInfo {
  speechRecognitionSupported: boolean;
  microphonePermission: string;
  userAgent: string;
  platform: string;
}

const MicrophoneDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    speechRecognitionSupported: false,
    microphonePermission: 'unknown',
    userAgent: '',
    platform: ''
  });

  useEffect(() => {
    const checkCapabilities = async () => {
      // Check Speech Recognition
      const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      
      // Check microphone permission
      let micPermission = 'unknown';
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          micPermission = result.state;
        }
      } catch (error) {
        console.log('Permissions API not available');
      }

      setDebugInfo({
        speechRecognitionSupported: hasSpeechRecognition,
        microphonePermission: micPermission,
        userAgent: navigator.userAgent,
        platform: navigator.platform
      });
    };

    checkCapabilities();
  }, []);

  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      alert('✅ Microphone is working! Permission granted.');
      // Refresh debug info
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setDebugInfo(prev => ({ ...prev, microphonePermission: result.state }));
    } catch (error) {
      alert('❌ Microphone test failed: ' + (error as Error).message);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-slate-700 hover:bg-slate-600 text-white rounded-full p-3 shadow-lg transition-all"
        title="Debug Info"
      >
        <Info className="w-5 h-5" />
      </button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed bottom-20 right-4 z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6 w-96"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Microphone Debug
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {/* Speech Recognition */}
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <span className="text-gray-300">Speech Recognition</span>
                {debugInfo.speechRecognitionSupported ? (
                  <span className="flex items-center gap-1 text-green-400">
                    <Check className="w-4 h-4" />
                    Supported
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    Not Supported
                  </span>
                )}
              </div>

              {/* Microphone Permission */}
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <span className="text-gray-300">Mic Permission</span>
                <span className={`font-medium ${
                  debugInfo.microphonePermission === 'granted' ? 'text-green-400' :
                  debugInfo.microphonePermission === 'denied' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {debugInfo.microphonePermission}
                </span>
              </div>

              {/* Platform */}
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <span className="text-gray-300 block mb-1">Platform</span>
                <span className="text-white text-xs">{debugInfo.platform}</span>
              </div>

              {/* User Agent */}
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <span className="text-gray-300 block mb-1">User Agent</span>
                <span className="text-white text-xs break-all">{debugInfo.userAgent}</span>
              </div>

              {/* Test Button */}
              <button
                onClick={testMicrophone}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all mt-4"
              >
                Test Microphone
              </button>

              {/* Tips */}
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-200 text-xs font-semibold mb-2">💡 Tips:</p>
                <ul className="text-amber-100/80 text-xs space-y-1">
                  <li>• Check system microphone settings</li>
                  <li>• Allow mic access in browser/app</li>
                  <li>• Try restarting the application</li>
                  <li>• Check console logs (F12)</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MicrophoneDebugPanel;
