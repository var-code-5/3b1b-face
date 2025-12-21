import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import Sidebar from './Sidebar';
import VoiceMicrophone from './VoiceMicrophone';
import ChatInterface from './ChatInterface';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  verified?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const VoiceDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const userKey = typeof user === 'object' && user !== null ? (user as any).email : user;
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load chat sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem(`chatSessions_${userKey}`);
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      const sessionsWithDates = parsed.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      setChatSessions(sessionsWithDates);
    }
  }, [user]);

  // Save chat sessions to localStorage
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem(`chatSessions_${userKey}`, JSON.stringify(chatSessions));
    }
  }, [chatSessions, user]);

  const handleSpeechEnd = (finalText: string, verified: boolean = false) => {
    if (!finalText) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: finalText,
      isUser: true,
      timestamp: new Date(),
      verified
    };

    // If no current session, create one
    if (!currentSessionId) {
      createNewSession([newMessage]);
    } else {
      addMessageToCurrentSession(newMessage);
    }

    // Simulate AI response
    setTimeout(() => {
      let aiText = `I heard you say: "${finalText}". This is a placeholder response. In a real application, this would be processed by an AI backend.`;

      if (!verified) {
        aiText = "Voice Verification failed, CANNOT proceed.";
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        isUser: false,
        timestamp: new Date()
      };
      addMessageToCurrentSession(aiResponse);
    }, 1000);

    // Clear transcript after finalizing
    setTranscript('');
  };

  const createNewSession = (initialMessages: Message[] = []) => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: initialMessages[0]?.text.substring(0, 30) + '...' || 'New Chat',
      messages: initialMessages,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages(initialMessages);
  };

  const addMessageToCurrentSession = (message: Message) => {
    setMessages(prev => [...prev, message]);

    setChatSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        const updatedMessages = [...session.messages, message];
        return {
          ...session,
          messages: updatedMessages,
          updatedAt: new Date(),
          title: session.messages.length === 0 ? message.text.substring(0, 30) + '...' : session.title
        };
      }
      return session;
    }));
  };

  const verifyVoice = async (audioBlob: Blob): Promise<boolean> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error("No access token found");
      return false;
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'voice_verify.webm');

    try {
      const response = await fetch('http://localhost:8000/verify_voice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data.verified === true;
      }
      return false;
    } catch (error) {
      console.error("Verification error", error);
      return false;
    }
  };

  const sendAudioToBackend = async () => {
    if (audioChunksRef.current.length === 0) {
      console.log('⚠️ No audio chunks to send');
      return;
    }

    setVerificationStatus('verifying');

    try {
      // Create audio blob from chunks (keep as webm since that's what we record)
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      console.log('📤 Sending audio to backend...', audioBlob.size, 'bytes');

      // Create FormData and append audio file for STT
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      // Parallel execution: STT and Voice Verification
      const sttPromise = fetch('https://dp6qmhnzu2b33f-8080.proxy.runpod.net/stt', {
        method: 'POST',
        body: formData
      }).then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`STT HTTP error! status: ${res.status} - ${errorText}`);
        }
        return res.json();
      });

      const verificationPromise = verifyVoice(audioBlob);

      const [sttData, isVerified] = await Promise.all([sttPromise, verificationPromise]);

      console.log('✅ Transcription received:', sttData);
      console.log('🔐 Verification result:', isVerified);

      setVerificationStatus(isVerified ? 'success' : 'failed');

      // Update transcript and handle the result regardless of verification status
      if (sttData.text && sttData.text.trim()) {
        setTranscript(sttData.text);
        handleSpeechEnd(sttData.text.trim(), isVerified);
      } else {
        console.log('⚠️ Empty transcript received');
        setTranscript('');
      }

    } catch (error) {
      console.error('❌ Failed to process audio:', error);
      console.error('Full error:', error);
      alert(`Failed to process audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setVerificationStatus('failed');
    } finally {
      // Clear audio chunks
      audioChunksRef.current = [];
      // Reset status after a delay if needed, or keep it to show last status
      setTimeout(() => setVerificationStatus('idle'), 3000);
    }
  };

  const startListening = async () => {
    if (!isListening) {
      setTranscript('');
      audioChunksRef.current = []; // Reset audio chunks

      try {
        console.log('🎤 Starting audio recording...');

        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Create MediaRecorder with wav format
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm' // Will convert to wav when sending
        });

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onerror = (error) => {
          console.error('❌ MediaRecorder error:', error);
          setIsListening(false);
        };

        mediaRecorder.onstop = async () => {
          console.log('🛑 MediaRecorder stopped, processing audio...');
          await sendAudioToBackend();
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(250); // Collect audio chunks every 250ms
        setIsListening(true);

      } catch (error) {
        console.error('❌ Failed to start audio recording:', error);
        alert('Failed to access microphone. Please check your microphone permissions.');
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      try {
        console.log('🛑 Stopping audio recording...');
        mediaRecorderRef.current.stop();

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        setIsListening(false);
        // Note: Audio will be sent to backend in the onstop event handler
      } catch (error) {
        console.error('❌ Error stopping audio recording:', error);
        setIsListening(false);
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const selectChatSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
    }
  };

  const createNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  const deleteSession = (sessionId: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      createNewChat();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100 overflow-hidden">

      {/* Sidebar */}
      <Sidebar
        user={user}
        logout={logout}
        chatSessions={chatSessions}
        currentSessionId={currentSessionId}
        onSelectSession={selectChatSession}
        onNewChat={createNewChat}
        onDeleteSession={deleteSession}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            // Initial Voice-Only State
            <VoiceMicrophone
              key="voice-only"
              isListening={isListening}
              transcript={transcript}
              onToggleListening={toggleListening}
              verificationStatus={verificationStatus}
            />
          ) : (
            // Chat Interface State
            <ChatInterface
              key="chat-interface"
              messages={messages}
              isListening={isListening}
              transcript={transcript}
              onToggleListening={toggleListening}
              verificationStatus={verificationStatus}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VoiceDashboard;
