import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Hash, AtSign, Search, ChevronRight
} from 'lucide-react';

const containerV = { animate: { transition: { staggerChildren: 0.06 } } };
const cardV = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } } };

export default function Chat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await api.get('/chat/rooms');
        setRooms(data);
        if (data.length > 0 && !activeRoom) setActiveRoom(data[0]);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchRooms();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeRoom) return;
    const fetchMessages = async () => {
      try {
        const { data } = await api.get(`/chat/rooms/${activeRoom.id}/messages`);
        setMessages(data);
      } catch (e) { console.error(e); }
    };
    fetchMessages();
    // Poll for new messages
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeRoom || sending) return;
    setSending(true);
    try {
      const { data } = await api.post(`/chat/rooms/${activeRoom.id}/messages`, { content: newMsg.trim() });
      setMessages(prev => [...prev, data]);
      setNewMsg('');
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) return <ChatSkeleton />;

  return (
    <motion.div data-testid="chat-page" variants={containerV} initial="initial" animate="animate" className="flex gap-4 h-[calc(100vh-7rem)]">
      {/* Room List */}
      <motion.div variants={cardV} className="w-72 flex-shrink-0 glass-card flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" /> Channels
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setActiveRoom(room)}
              data-testid={`room-${room.id}`}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                activeRoom?.id === room.id
                  ? 'bg-indigo-500/10 text-indigo-400'
                  : 'text-[var(--text-secondary)] hover:bg-white/[0.03] hover:text-white'
              }`}
            >
              <Hash className="w-4 h-4 flex-shrink-0" style={{ color: room.color || '#6366f1' }} />
              <span className="text-sm font-medium truncate flex-1">{room.name}</span>
              {room.unread_count > 0 && (
                <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {room.unread_count}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Chat Area */}
      <motion.div variants={cardV} className="flex-1 glass-card flex flex-col overflow-hidden">
        {/* Chat Header */}
        {activeRoom && (
          <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center gap-3">
            <Hash className="w-5 h-5" style={{ color: activeRoom.color || '#6366f1' }} />
            <div>
              <p className="text-sm font-semibold">{activeRoom.name}</p>
              <p className="text-[11px] text-[var(--text-muted)]">{activeRoom.description}</p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-10 h-10 text-[var(--text-muted)] mb-3 opacity-30" />
              <p className="text-[var(--text-muted)] text-sm">Say hello! Start the conversation.</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isOwn = msg.sender_id === user?.id;
              const showAvatar = i === 0 || messages[i-1]?.sender_id !== msg.sender_id;
              return (
                <motion.div
                  key={msg.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  {showAvatar ? (
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${
                      isOwn ? 'bg-gradient-to-br from-indigo-500 to-cyan-400' : 'bg-[var(--surface-3)]'
                    }`}>
                      {msg.sender_name?.charAt(0).toUpperCase()}
                    </div>
                  ) : <div className="w-8 flex-shrink-0" />}
                  <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                    {showAvatar && (
                      <p className={`text-[11px] mb-1 ${isOwn ? 'text-indigo-400' : 'text-[var(--text-muted)]'}`}>
                        {isOwn ? 'You' : msg.sender_name}
                        <span className="text-[var(--text-muted)] ml-2">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </p>
                    )}
                    <div className={`inline-block px-4 py-2.5 rounded-2xl text-sm ${
                      isOwn
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : 'bg-[var(--surface-2)] text-[var(--text-primary)] rounded-bl-md'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        {activeRoom && (
          <div className="px-5 py-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <input
                data-testid="chat-input"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message #${activeRoom.name}...`}
                className="flex-1 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={!newMsg.trim() || sending}
                data-testid="chat-send-btn"
                className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">
      <div className="w-72 glass-card shimmer-bg rounded-2xl" />
      <div className="flex-1 glass-card shimmer-bg rounded-2xl" />
    </div>
  );
}
