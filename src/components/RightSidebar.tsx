import React, { useEffect, useState } from 'react';
import { MessageSquare, Shield, Sparkles, Send, ArrowRight } from 'lucide-react';
import { subscribeToChatMessages, sendChatMessage } from '../firebase/chat';
import { ChatMessage, UserProfile } from '../types';
import { timeAgo } from '../utils/timeAgo';

interface RightSidebarProps {
  profile: UserProfile | null;
  onOpenFullChat: () => void;
  onOpenGuidelines: () => void;
  onTriggerReport: (type: 'chat', id: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  profile,
  onOpenFullChat,
  onOpenGuidelines,
}) => {
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  const [quickInput, setQuickInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToChatMessages(
      (msgs) => {
        // Show last 4 messages in preview
        setRecentMessages(msgs.slice(-4));
      },
      (err) => {
        console.error('Chat preview error', err);
      }
    );
    return () => unsub();
  }, []);

  const handleQuickSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim() || !profile || isSending) return;

    setIsSending(true);
    setSendError(null);
    try {
      await sendChatMessage(quickInput.trim(), profile.alias, profile.avatar);
      setQuickInput('');
    } catch (err: any) {
      setSendError(err.message || 'Could not send message');
      setTimeout(() => setSendError(null), 4000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <aside className="w-72 shrink-0 hidden lg:flex flex-col gap-4 py-4 select-none">
      {/* Live Campus Chat Preview Widget */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-stone-100 bg-[#fdfbf7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-xs text-stone-900 tracking-wide uppercase">
              Live Campus Chat
            </h3>
          </div>
          <button
            onClick={onOpenFullChat}
            className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-0.5"
          >
            Open <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Messages preview */}
        <div className="p-3 space-y-2.5 min-h-[170px] max-h-[220px] overflow-y-auto">
          {recentMessages.length === 0 ? (
            <div className="text-center py-6 text-stone-400 text-xs">
              No live chat messages yet. Say hello!
            </div>
          ) : (
            recentMessages.map((msg) => (
              <div key={msg.id} className="text-xs space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-stone-800 truncate text-[11px] flex items-center gap-1">
                    <span>{msg.authorAvatar}</span>
                    <span className="truncate max-w-[120px]">{msg.authorAlias}</span>
                  </span>
                  <span className="text-[10px] text-stone-400 shrink-0">
                    {timeAgo(msg.createdAt)}
                  </span>
                </div>
                <p className="text-stone-700 break-words text-[11px] pl-4">
                  {msg.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Quick Send Input */}
        <form onSubmit={handleQuickSend} className="p-2 border-t border-stone-100 bg-stone-50/60">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Drop a quick comment..."
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              maxLength={280}
              className="flex-1 bg-white border border-stone-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
            <button
              type="submit"
              disabled={isSending || !quickInput.trim()}
              className="p-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          {sendError && (
            <p className="text-[10px] text-rose-600 mt-1 px-1">{sendError}</p>
          )}
        </form>
      </div>

      {/* Community Guidelines Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2 text-stone-900 font-bold text-xs uppercase tracking-wider">
          <Shield className="w-4 h-4 text-amber-700" />
          <span>Campus Safety</span>
        </div>
        <ul className="text-xs text-stone-600 space-y-1.5 pl-4 list-disc marker:text-amber-500">
          <li>Never reveal private student names, numbers, or doxxing info.</li>
          <li>Instant publishing: be honest without harassing peers.</li>
          <li>Flag or report inappropriate content anytime.</li>
        </ul>
        <button
          onClick={onOpenGuidelines}
          className="text-xs font-semibold text-amber-700 hover:underline pt-1 block"
        >
          Read complete community rules →
        </button>
      </div>

      {/* Verified Open-Source AI Details */}
      <div className="bg-stone-100/70 rounded-2xl border border-stone-200/70 p-3.5 text-[11px] text-stone-600 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-stone-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Open-Source AI Verification</span>
        </div>
        <p className="leading-relaxed">
          Powered by <strong className="text-stone-800">Transformers.js</strong> running client-side DistilBERT ONNX weights under <strong className="text-stone-800">Apache-2.0</strong> license. No paid proprietary APIs used.
        </p>
      </div>
    </aside>
  );
};
