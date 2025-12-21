import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChatSession } from './VoiceDashboard';
import {
  MessageSquarePlus,
  MessageSquare,
  Trash2,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  user: any | null;
  logout: () => void;
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  logout,
  chatSessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const groupedSessions = chatSessions.reduce((acc, session) => {
    const dateLabel = formatDate(session.updatedAt);
    if (!acc[dateLabel]) {
      acc[dateLabel] = [];
    }
    acc[dateLabel].push(session);
    return acc;
  }, {} as Record<string, ChatSession[]>);

  return (
    <motion.div
      initial={{ width: 280 }}
      animate={{ width: isCollapsed ? 60 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-slate-800/50 backdrop-blur-md border-r border-slate-700/50 flex flex-col relative"
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-10 bg-slate-700 hover:bg-slate-600 rounded-full p-1.5 border border-slate-600 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-300" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-300" />
        )}
      </button>

      {/* User Profile */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-medium text-gray-200 truncate">
                  {typeof user === 'object' && user !== null ? (user as any).email : user}
                </p>
                <p className="text-xs text-gray-400">Online</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={onNewChat}
          className="w-full bg-zinc-200 hover:bg-zinc-300 text-black border-0 shadow-lg"
          size={isCollapsed ? 'icon' : 'default'}
        >
          <MessageSquarePlus className="w-5 h-5" />
          {!isCollapsed && <span className="ml-2">New Chat</span>}
        </Button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {Object.entries(groupedSessions).map(([dateLabel, sessions]) => (
                <div key={dateLabel} className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-400 px-3 mb-2">
                    {dateLabel}
                  </h3>
                  <div className="space-y-1">
                    {sessions.map(session => (
                      <div
                        key={session.id}
                        className="relative group"
                        onMouseEnter={() => setHoveredSessionId(session.id)}
                        onMouseLeave={() => setHoveredSessionId(null)}
                      >
                        <button
                          onClick={() => onSelectSession(session.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2 ${currentSessionId === session.id
                            ? 'bg-slate-700/70 text-white'
                            : 'text-gray-300 hover:bg-slate-700/50'
                            }`}
                        >
                          <MessageSquare className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm truncate flex-1">
                            {session.title}
                          </span>
                        </button>
                        {hoveredSessionId === session.id && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {isCollapsed && chatSessions.length > 0 && (
          <div className="space-y-2">
            {chatSessions.slice(0, 10).map(session => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`w-full p-2 rounded-lg transition-all ${currentSessionId === session.id
                  ? 'bg-slate-700/70'
                  : 'hover:bg-slate-700/50'
                  }`}
              >
                <MessageSquare className="w-5 h-5 text-gray-300 mx-auto" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Logout Button */}
      <div className="p-3 border-t border-slate-700/50">
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full text-gray-300 hover:text-white hover:bg-slate-700/50"
          size={isCollapsed ? 'icon' : 'default'}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
