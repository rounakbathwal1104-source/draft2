import React, { useEffect, useState } from 'react';
import {
  Flame,
  Clock,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  Info,
  Cpu,
  Coffee,
} from 'lucide-react';
import { subscribeToModelProgress, ModelProgress, MODEL_ID } from '../services/aiTeaInsights';

interface SidebarNavProps {
  currentTab: 'recent' | 'popular';
  onChangeTab: (tab: 'recent' | 'popular') => void;
  activeView: 'feed' | 'chat';
  onSelectView: (view: 'feed' | 'chat') => void;
  onOpenGuidelines: () => void;
  onOpenCreatePost: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentTab,
  onChangeTab,
  activeView,
  onSelectView,
  onOpenGuidelines,
  onOpenCreatePost,
}) => {
  const [modelProgress, setModelProgress] = useState<ModelProgress>({
    status: 'idle',
    progressPercent: 0,
    statusMessage: 'Ready to load on demand',
  });

  useEffect(() => {
    return subscribeToModelProgress(setModelProgress);
  }, []);

  return (
    <aside className="w-56 shrink-0 hidden md:flex flex-col gap-5 py-4 select-none">
      {/* Primary Navigation Links */}
      <nav className="flex flex-col gap-1">
        <button
          onClick={() => {
            onSelectView('feed');
            onChangeTab('recent');
          }}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeView === 'feed' && currentTab === 'recent'
              ? 'bg-amber-100/80 text-amber-900 border border-amber-200/80 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Recent Tea</span>
        </button>

        <button
          onClick={() => {
            onSelectView('feed');
            onChangeTab('popular');
          }}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeView === 'feed' && currentTab === 'popular'
              ? 'bg-amber-100/80 text-amber-900 border border-amber-200/80 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
          }`}
        >
          <Flame className="w-4 h-4 text-orange-500" />
          <span>Popular Spills</span>
        </button>

        <button
          onClick={() => onSelectView('chat')}
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeView === 'chat'
              ? 'bg-amber-100/80 text-amber-900 border border-amber-200/80 shadow-2xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-4 h-4 text-amber-600" />
            <span>Campus Chat</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </button>
      </nav>

      {/* Spill Post Button */}
      <div className="px-1">
        <button
          onClick={onOpenCreatePost}
          className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
        >
          <Coffee className="w-4 h-4 text-amber-400" />
          <span>Spill New Tea</span>
        </button>
      </div>

      {/* AI Tea Insights Engine Status Card */}
      <div className="rounded-xl p-3 bg-amber-50/60 border border-amber-200/70 text-xs">
        <div className="flex items-center gap-1.5 text-amber-900 font-bold mb-1">
          <Cpu className="w-3.5 h-3.5 text-amber-600" />
          <span>Open-Source AI Engine</span>
        </div>
        <p className="text-[11px] text-stone-600 mb-2 leading-relaxed">
          In-browser inference using Hugging Face Transformers.js and ONNX Runtime.
        </p>

        <div className="bg-white/80 p-2 rounded-lg border border-amber-200/60 space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-stone-500 font-mono">Model</span>
            <span className="font-semibold text-stone-800 truncate max-w-[90px]" title={MODEL_ID}>
              DistilBERT-SST2
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-stone-500">Status</span>
            <span
              className={`font-semibold capitalize ${
                modelProgress.status === 'ready'
                  ? 'text-emerald-700'
                  : modelProgress.status === 'loading'
                  ? 'text-amber-700 animate-pulse'
                  : modelProgress.status === 'error'
                  ? 'text-rose-700'
                  : 'text-stone-600'
              }`}
            >
              {modelProgress.status === 'ready'
                ? 'Ready (Cached)'
                : modelProgress.status === 'loading'
                ? `${modelProgress.progressPercent}%`
                : modelProgress.status}
            </span>
          </div>
        </div>
      </div>

      {/* Campus Trust & Rules */}
      <div className="mt-auto px-1 flex flex-col gap-2 text-[11px] text-stone-500">
        <button
          onClick={onOpenGuidelines}
          className="flex items-center gap-1.5 hover:text-stone-800 text-left transition-colors font-medium"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>Campus Guidelines & Privacy</span>
        </button>
        <p className="text-[10px] text-stone-400 leading-tight">
          Anonymous sessions are private, not guaranteed untraceable. Be honest, be kind.
        </p>
      </div>
    </aside>
  );
};
