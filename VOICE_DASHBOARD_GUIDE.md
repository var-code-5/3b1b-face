# Voice-Enabled ChatGPT-like Dashboard

## Features

### 🎙️ Voice Interaction
- **Voice-First Design**: Start conversations naturally using your voice
- **Web Speech API Integration**: Browser-native speech-to-text (no backend required)
- **Real-Time Transcription**: See your words appear as you speak
- **Visual Feedback**: Animated microphone button and audio visualizer

### 💬 Chat Interface
- **ChatGPT-Style Messages**: Clean, modern message bubbles
- **Smooth Transitions**: Seamless animation from voice-only to chat mode
- **Conversation History**: All messages saved per session
- **User/AI Distinction**: Different avatars and styling for user vs AI messages

### 📋 Session Management
- **Collapsible Sidebar**: Toggle between expanded and icon-only views
- **Chat History**: View and access all previous conversations
- **Grouped by Date**: Sessions organized by "Today", "Yesterday", etc.
- **Delete Sessions**: Remove unwanted conversations
- **New Chat**: Start fresh conversations anytime

### 🎨 Design
- **Dark Mode**: Modern dark theme matching the existing color scheme
- **Green-Blue Gradient**: Consistent with the app's branding
- **Smooth Animations**: Powered by Framer Motion
- **Responsive Layout**: Works seamlessly on desktop

## How It Works

### First Load (Voice-Only State)
1. Dashboard displays a centered microphone button
2. Minimal, clean interface with greeting text
3. No chat messages visible initially

### Voice Interaction Flow
1. **Click Microphone**: Starts listening via Web Speech API
2. **Speak**: Real-time transcription appears below the mic
3. **Audio Visualizer**: Animated bars show audio levels
4. **Auto-Stop**: Stops when you finish speaking
5. **Message Creation**: Transcribed text becomes a chat message
6. **AI Response**: Simulated response appears (ready for backend integration)

### Chat Mode
- Once the first message is sent, the interface transitions to chat mode
- Microphone moves to the bottom of the screen
- Messages stack vertically like ChatGPT
- Click mic anytime to send more voice messages
- Chat history persists in localStorage

## Components

### VoiceDashboard.tsx
Main orchestrator component that manages:
- Speech recognition setup
- Chat sessions and messages
- State transitions between voice-only and chat modes
- localStorage persistence

### Sidebar.tsx
Left sidebar featuring:
- User profile with avatar
- New chat button
- Session history with date grouping
- Collapse/expand functionality
- Session delete functionality
- Logout button

### VoiceMicrophone.tsx
Initial voice-only interface with:
- Centered microphone button
- Pulsing animation rings when listening
- Audio visualizer bars
- Live transcript display
- Instructions and status

### ChatInterface.tsx
Chat view featuring:
- Message list with auto-scroll
- User and AI message bubbles
- Timestamp for each message
- Bottom microphone button
- Live transcript during recording

## Browser Compatibility

The Web Speech API requires:
- Chrome/Edge (recommended)
- Safari (limited support)
- Firefox (with flags enabled)

**Note**: HTTPS or localhost required for microphone access

## Future Enhancements

- [ ] Backend AI integration for real responses
- [ ] Export chat transcripts
- [ ] Voice settings (language, speed)
- [ ] Search through chat history
- [ ] Message editing
- [ ] File/image attachments
- [ ] Voice synthesis for AI responses (text-to-speech)
- [ ] Multiple language support
- [ ] Custom wake word detection

## Usage Tips

1. **Allow Microphone Access**: Browser will request permission on first use
2. **Speak Clearly**: Works best in quiet environments
3. **Natural Pauses**: The system detects when you stop speaking
4. **Manual Stop**: Click the mic again if auto-stop doesn't trigger
5. **Session Organization**: Sessions are auto-titled from first message
