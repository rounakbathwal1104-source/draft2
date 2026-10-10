import React, { useEffect, useState, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Loader2,
  Flag,
  Shield,
  Wifi,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { subscribeToChatMessages, sendChatMessage, getCooldownRemaining } from '../firebase/chat';
import { ChatMessage, UserProfile } from '../types';
import { timeAgo } from '../utils/timeAgo';

interface LiveChatViewProps {
  profile: UserProfile | null;
  onTriggerReport: (type: 'chat', id: string) => void;
  onOpenGuidelines: () => void;
}

export const LiveChatView: React.FC<LiveChatViewProps> = ({
  profile,
  onTriggerReport,
  onOpenGuidelines,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const cooldownIntervalRef = useRef<any>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToChatMessages(
      (list) => {
        setMessages(list);
        setLoading(false);
      },
      (err) => {
        console.error('Chat error:', err);
        setError('Failed to connect to live campus chat.');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startCooldownTicker = () => {
    setCooldownSec(3);
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    cooldownIntervalRef.current = setInterval(() => {
      const rem = getCooldownRemaining();
      setCooldownSec(rem);
      if (rem <= 0) {
        clearInterval(cooldownIntervalRef.current);
      }
    }, 500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newMessage.trim();
    if (!clean || sending || cooldownSec > 0 || !profile) return;

    if (clean.length > 280) {
      setError('Chat messages cannot exceed 280 characters.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await sendChatMessage(clean, profile.alias, profile.avatar);
      setNewMessage('');
      startCooldownTicker();
    } catch (err: any) {
      setError(err?.message || 'Could not send chat message.');
      const rem = getCooldownRemaining();
      if (rem > 0) setCooldownSec(rem);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto flex flex-col h-[calc(100vh-5.5rem)] bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden">
      {/* Chat Room Header */}
      <div className="px-5 py-3.5 border-b border-stone-200/80 bg-[#fdfbf7] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-stone-900 text-base">
                Campus Live Tea Chat
              </h1>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Ephemeral student chatter • 280 char limit • Real-time across devices
            </p>
          </div>
        </div>

        <button
          onClick={onOpenGuidelines}
          className="text-stone-400 hover:text-stone-700 p-2 rounded-xl hover:bg-stone-100 transition-colors"
          title="Campus Guidelines"
        >
          <Shield className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#faf8f5]/40">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
            <span className="text-xs">Connecting to campus chat stream...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-2">
            <div className="text-3xl">🫖</div>
            <p className="font-semibold text-stone-700 text-sm">Quiet in the campus lounge.</p>
            <p className="text-xs text-stone-500">Be the first to say what everyone is thinking!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = profile && profile.alias === msg.authorAlias;
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] sm:max-w-[75%] ${
                  isMe ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-base shrink-0 shadow-2xs select-none">
                  {msg.authorAvatar}
                </div>

                {/* Bubble */}
                <div className="flex flex-col gap-0.5">
                  <div
                    className={`flex items-center gap-1.5 text-[11px] ${
                      isMe ? 'justify-end text-amber-900' : 'text-stone-600'
                    }`}
                  >
                    <span className="font-bold truncate max-w-[130px]">
                      {msg.authorAlias} {isMe && '(You)'}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {timeAgo(msg.createdAt)}
                    </span>
                    {!isMe && (
                      <button
                        onClick={() => onTriggerReport('chat', msg.id)}
                        className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-500 p-0.5"
                        title="Report message"
                      >
                        <Flag className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  <div
                    className={`p-3 rounded-2xl text-xs sm:text-sm break-words leading-relaxed shadow-2xs ${
                      isMe
                        ? 'bg-amber-600 text-white rounded-tr-xs'
                        : 'bg-white text-stone-800 border border-stone-200/80 rounded-tl-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Message Input Area */}
      <div className="p-3 sm:p-4 border-t border-stone-200/80 bg-white">
        <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
          {error && (
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
              {error.toLowerCase().includes('authenticated') && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const { signInWithGoogle } = await import('../firebase/auth');
                      await signInWithGoogle();
                      setError(null);
                    } catch (e: any) {
                      setError(e?.message || 'Google sign-in failed');
                    }
                  }}
                  className="font-bold text-amber-800 hover:underline cursor-pointer"
                >
                  Sign in with Google
                </button>
              )}
            </div>
          )}

          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={
                cooldownSec > 0
                  ? `Cooldown active (${cooldownSec}s)...`
                  : 'Message live campus chat... (max 280 chars)'
              }
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending || cooldownSec > 0}
              maxLength={280}
              className="w-full pl-3.5 pr-20 py-2.5 bg-stone-50 hover:bg-stone-100/60 focus:bg-white border border-stone-200 rounded-2xl text-stone-900 text-xs sm:text-sm placeholder-stone-400 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all disabled:opacity-60"
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-stone-400 hidden sm:inline">
                {newMessage.length}/280
              </span>

              <button
                type="submit"
                disabled={!newMessage.trim() || sending || cooldownSec > 0}
                className="p-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : cooldownSec > 0 ? (
                  <span className="text-[10px] font-bold px-1">{cooldownSec}s</span>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
            <span>
              Chatting as <strong className="text-stone-700">{profile?.avatar} {profile?.alias}</strong>
            </span>
            <span className="text-[10px]">Anti-spam rate limit: 2.5s</span>
          </div>
        </form>
      </div>
    </div>
  );
};
