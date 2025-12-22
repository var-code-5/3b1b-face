import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Message } from './VoiceDashboard';
import { Mic, MicOff, User, Bot, CheckCircle, XCircle } from 'lucide-react';
import FormattedMessage from './FormattedMessage';

interface ChatInterfaceProps {
  messages: Message[];
  isListening: boolean;
  transcript: string;
  onToggleListening: () => void;
  verificationStatus?: 'idle' | 'verifying' | 'success' | 'failed';
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isListening,
  transcript,
  onToggleListening,
  verificationStatus
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transcript]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col h-full"
    >
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
      >
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            {/* AI Avatar */}
            {!message.isUser && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}

            {/* Message Bubble */}
            <div className="relative">
              <div
                className={`max-w-2xl ${message.isUser
                  ? 'bg-gradient-to-br from-green-500 to-blue-500 text-white'
                  : 'bg-slate-800/50 backdrop-blur-md border border-slate-700/50 text-gray-200'
                  } rounded-2xl px-5 py-3 shadow-lg`}
              >
                <FormattedMessage text={message.text} isUser={message.isUser} />
                <p
                  className={`text-xs mt-2 ${message.isUser ? 'text-green-100' : 'text-gray-400'
                    }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>

              {/* Verified Tickmark */}
              {message.isUser && message.verified === true && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -bottom-2 -right-2 bg-white rounded-full p-0.5 shadow-md"
                >
                  <CheckCircle className="w-4 h-4 text-green-500 fill-green-100" />
                </motion.div>
              )}

              {/* Failed Verification Cross */}
              {message.isUser && message.verified === false && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -bottom-2 -right-2 bg-white rounded-full p-0.5 shadow-md"
                >
                  <XCircle className="w-4 h-4 text-red-500 fill-red-100" />
                </motion.div>
              )}
            </div>

            {/* User Avatar */}
            {message.isUser && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </motion.div>
        ))}

        {/* Live Transcript while speaking */}
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end gap-3"
          >
            <div className="max-w-2xl bg-gradient-to-br from-green-500/50 to-blue-500/50 border-2 border-green-400 text-white rounded-2xl px-5 py-3 shadow-lg">
              <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                {transcript}
              </p>
              <p className="text-xs mt-2 text-green-100 italic flex items-center gap-2">
                {isListening ? 'Listening...' : verificationStatus === 'verifying' ? 'Verifying Voice...' : 'Processing...'}
                {verificationStatus === 'verifying' && (
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                )}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
              <User className="w-5 h-5 text-white" />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area with Microphone */}
      <div className="border-t border-slate-700/50 bg-slate-800/30 backdrop-blur-md p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {/* Microphone Button */}
          <motion.button
            onClick={onToggleListening}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all flex-shrink-0 ${isListening
              ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
              : 'bg-zinc-200 hover:bg-zinc-300 text-black'
              }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isListening ? { scale: [1, 1.05, 1] } : {}}
            transition={isListening ? { duration: 1, repeat: Infinity } : {}}
          >
            {isListening ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </motion.button>

          {/* Status Text */}
          <div className="flex-1">
            {isListening ? (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-red-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </div>
                <span className="text-gray-300 text-sm">Listening...</span>
              </div>
            ) : (
              <span className="text-gray-400 text-sm">
                Click the microphone to speak
              </span>
            )}
          </div>

          {/* Audio Visualizer when listening */}
          {isListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 h-14"
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-gradient-to-t from-green-400 to-blue-500 rounded-full"
                  animate={{
                    height: [8, Math.random() * 32 + 8, 8]
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.08,
                    ease: 'easeInOut'
                  }}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatInterface;
