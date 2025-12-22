import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import Sidebar from './Sidebar';
import VoiceMicrophone from './VoiceMicrophone';
import ChatInterface from './ChatInterface';
import { convertWebMToWav } from '../utils/audioConverter';

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
  const currentSessionIdRef = useRef<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

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
  }, [chatSessions, userKey]);

  // Load current session ID
  useEffect(() => {
    const savedSessionId = localStorage.getItem(`currentSessionId_${userKey}`);
    if (savedSessionId) {
      setCurrentSessionId(savedSessionId);
    }
  }, [userKey]);

  // Save current session ID
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem(`currentSessionId_${userKey}`, currentSessionId);
    } else {
      localStorage.removeItem(`currentSessionId_${userKey}`);
    }
  }, [currentSessionId, userKey]);

  const updateMessage = (id: string, text: string, sessionId: string) => {
    if (sessionId === currentSessionIdRef.current) {
      setMessages(prev => prev.map(msg =>
        msg.id === id ? { ...msg, text } : msg
      ));
    }

    setChatSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const updatedMessages = session.messages.map(msg =>
          msg.id === id ? { ...msg, text } : msg
        );
        return {
          ...session,
          messages: updatedMessages,
          updatedAt: new Date()
        };
      }
      return session;
    }));
  };

  const createNewSession = (initialMessages: Message[] = []) => {
    const newSessionId = Date.now().toString();
    const newSession: ChatSession = {
      id: newSessionId,
      title: initialMessages[0]?.text.substring(0, 30) + '...' || 'New Chat',
      messages: initialMessages,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    setMessages(initialMessages);
    return newSessionId;
  };

  const handleSpeechEnd = async (finalText: string, verified: boolean = false) => {
    if (!finalText) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: finalText,
      isUser: true,
      timestamp: new Date(),
      verified
    };

    let activeSessionId = currentSessionIdRef.current;

    // If no current session, create one
    if (!activeSessionId) {
      console.log('Creating new session for message:', newMessage);
      activeSessionId = createNewSession([newMessage]);
    } else {
      console.log('Adding message to existing session:', activeSessionId);
      addMessageToCurrentSession(newMessage, activeSessionId);
    }

    if (!verified) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Voice Verification failed, but proceeding...",
        isUser: false,
        timestamp: new Date()
      };

      setTimeout(() => {
        addMessageToCurrentSession(errorMsg, activeSessionId!);
      }, 100);
      // return; // Proceeding to LLM even if verification fails
    }

    // Create placeholder AI message
    const aiMessageId = (Date.now() + 2).toString();
    const aiPlaceholder: Message = {
      id: aiMessageId,
      text: "...",
      isUser: false,
      timestamp: new Date()
    };

    setTimeout(() => {
      addMessageToCurrentSession(aiPlaceholder, activeSessionId!);
      console.log(`🤖 Calling streamLlmResponse with prompt: "${finalText}"`);
      streamLlmResponse(finalText, aiMessageId, activeSessionId!);
    }, 200); // Slight delay to appear after error message if any
  };

  const streamLlmResponse = async (prompt: string, messageId: string, sessionId: string) => {
    console.log(`🌊 streamLlmResponse started for messageId: ${messageId}, sessionId: ${sessionId}`);
    try {
      const response = await fetch('http://localhost:8080/llm/get-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ intent: prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue; // OpenAI style
            try {
              const json = JSON.parse(data);
              if (json.text) aiText += json.text;
              else if (json.delta) aiText += json.delta;
              else if (json.content) aiText += json.content;
              else aiText += data; // Fallback
            } catch (e) {
              aiText += data;
            }
          } else {
            if (!line.startsWith('id:') && !line.startsWith('event:') && !line.startsWith('retry:')) {
              aiText += line;
            }
          }
        }

        updateMessage(messageId, aiText, sessionId);
      }

    } catch (error) {
      console.error("LLM Error:", error);
      alert(`LLM Error: ${error instanceof Error ? error.message : String(error)}`);
      updateMessage(messageId, "Error fetching response from AI agent.", sessionId);
    }
  };

  const addMessageToCurrentSession = (message: Message, sessionId: string) => {
    if (sessionId === currentSessionIdRef.current) {
      setMessages(prev => [...prev, message]);
    }

    setChatSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
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
    formData.append('file', audioBlob, 'voice_verify.wav');

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
      // Create audio blob from chunks (WebM format from recording)
      const webmBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      console.log('🔄 Converting WebM to WAV...');
      // Convert WebM to WAV for backend compatibility
      const audioBlob = await convertWebMToWav(webmBlob);

      console.log('📤 Sending audio to backend...', audioBlob.size, 'bytes');

      // Create FormData and append audio file for STT
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');

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
      console.log('Processing STT data:', sttData);
      if (sttData.text && sttData.text.trim()) {
        console.log('Text found, handling speech end:', sttData.text);
        setTranscript(sttData.text);
        handleSpeechEnd(sttData.text.trim(), isVerified);
      } else {
        console.log('⚠️ Empty transcript received or text field missing in:', sttData);
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
    <div className="flex h-screen bg-[#EFE9E3] text-gray-100 overflow-hidden">

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
