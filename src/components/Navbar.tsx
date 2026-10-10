import React from 'react';
import { Coffee, MessageCircle, Sparkles, Plus, Search, User as UserIcon } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  profile: UserProfile | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreatePost: () => void;
  onOpenProfile: () => void;
  onNavigateChat: () => void;
  activeView: 'feed' | 'chat';
  onNavigateHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  searchQuery,
  onSearchChange,
  onOpenCreatePost,
  onOpenProfile,
  onNavigateChat,
  activeView,
  onNavigateHome,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#fdfbf7]/90 backdrop-blur-md border-b border-stone-200/80 px-4 lg:px-8 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg p-1"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-sm shadow-amber-600/20 group-hover:scale-105 transition-transform">
            <Coffee className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-stone-900 group-hover:text-amber-700 transition-colors">
                Eneyetea
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200/60 hidden sm:inline-block">
                Campus
              </span>
            </div>
            <p className="text-[11px] text-stone-500 -mt-1 hidden md:block">
              Spill the unverified tea
            </p>
          </div>
        </button>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg mx-2">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search campus confessions, gossip, tea..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-stone-100/80 hover:bg-stone-100 focus:bg-white border border-transparent focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-full transition-all outline-none text-stone-800 placeholder-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 px-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Live Chat Tab Trigger (Desktop & Tablet) */}
          <button
            onClick={onNavigateChat}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'chat'
                ? 'bg-amber-100 text-amber-900 border border-amber-300/80'
                : 'text-stone-700 hover:bg-stone-100/90 hover:text-stone-900'
            }`}
            title="Live Campus Chat"
          >
            <div className="relative">
              <MessageCircle className="w-4 h-4 text-amber-600" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse ring-1 ring-white" />
            </div>
            <span className="hidden md:inline">Live Chat</span>
          </button>

          {/* Spill Tea CTA button */}
          <button
            onClick={onOpenCreatePost}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-sm font-semibold rounded-full shadow-sm hover:shadow transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline">Spill Tea</span>
          </button>

          {/* User Anonymous Identity Pill */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-2.5 py-1 bg-stone-100 hover:bg-amber-50/80 hover:border-amber-300 border border-stone-200/80 rounded-full transition-all text-left text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            title="Customize your anonymous alias & avatar"
          >
            <span className="text-base leading-none select-none">
              {profile?.avatar || '🫖'}
            </span>
            <div className="hidden lg:block max-w-[120px] truncate">
              <span className="font-semibold text-stone-800 block truncate">
                {profile?.alias || 'Anonymous'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
