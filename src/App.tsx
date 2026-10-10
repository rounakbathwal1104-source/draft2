import React, { useEffect, useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { SidebarNav } from './components/SidebarNav';
import { RightSidebar } from './components/RightSidebar';
import { PostCard } from './components/PostCard';
import { LiveChatView } from './components/LiveChatView';
import { CreatePostModal } from './components/CreatePostModal';
import { ProfileModal } from './components/ProfileModal';
import { ReportModal } from './components/ReportModal';
import { CommunityGuidelinesModal } from './components/CommunityGuidelinesModal';
import { BottomNav } from './components/BottomNav';
import {
  ensureAnonymousAuth,
  signInWithGoogle,
  getLocalCachedProfile,
  setupUserProfile,
} from './firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, testConnection } from './firebase/config';
import { subscribeToPosts, createPost } from './firebase/posts';
import { Post, UserProfile } from './types';
import {
  Loader2,
  Plus,
  Coffee,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  LogIn,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile>(getLocalCachedProfile());
  const [authLoading, setAuthLoading] = useState(true);
  const [isAnonymousRestricted, setIsAnonymousRestricted] = useState(false);

  // Feed & Navigation State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'recent' | 'popular'>('recent');
  const [activeView, setActiveView] = useState<'feed' | 'chat'>('feed');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: 'post' | 'comment' | 'chat';
    id: string;
  } | null>(null);

  // 1. Initialize Authentication
  const initAuth = async () => {
    setAuthLoading(true);
    testConnection();
    const res = await ensureAnonymousAuth();
    if (res.user) {
      setUser(res.user);
      setIsAnonymousRestricted(false);
    } else {
      if (res.isAnonymousRestricted) {
        setIsAnonymousRestricted(true);
      }
    }
    setProfile(res.profile);
    setAuthLoading(false);
  };

  useEffect(() => {
    initAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setIsAnonymousRestricted(false);
        const p = await setupUserProfile(u);
        setProfile(p);
      }
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Posts Stream (Public feed reading enabled)
  useEffect(() => {
    setLoadingPosts(true);
    setFeedError(null);

    const unsubscribe = subscribeToPosts(
      currentTab,
      60,
      async (incomingPosts) => {
        // If database is empty on first boot, seed sample campus confessions
        if (incomingPosts.length === 0 && user) {
          try {
            await seedStarterTeaIfEmpty();
          } catch (seedErr) {
            console.error('Seeding starter tea failed:', seedErr);
          }
        }
        setPosts(incomingPosts);
        setLoadingPosts(false);
      },
      (err) => {
        console.error('Feed error:', err);
        setFeedError('Unable to load feed from Firestore.');
        setLoadingPosts(false);
      }
    );

    return () => unsubscribe();
  }, [currentTab, user]);

  // Seed helpful starter tea if feed has 0 posts
  const seedStarterTeaIfEmpty = async () => {
    try {
      await createPost(
        "Accidentally joined a 400-level CS graduate seminar Zoom call while eating cereal in my pajamas. The professor called on me for the tensor contraction formula and I panicked, mumbled 'network jitter', and hit Leave Meeting. I'm a freshman history major.",
        'Sleepy Otter #29',
        '🦦',
        {
          label: 'POSITIVE',
          score: 0.94,
          model: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
          summary: 'High confidence wholesome campus experience (94.0%). Relatable freshman humor.',
          vibe: '✨ Wholesome Campus Win',
          analyzedAt: new Date().toISOString(),
        }
      );
      await createPost(
        "Whoever keeps reheating fish in the 3rd floor library microwave during finals week: your academic privileges should be permanently revoked.",
        'Caffeinated Chemist #14',
        '🍵',
        {
          label: 'NEGATIVE',
          score: 0.96,
          model: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
          summary: 'Strong negative sentiment (96.0%). Expressing high campus frustration or tea spill.',
          vibe: '🔥 Spicy Drama / High Rant',
          analyzedAt: new Date().toISOString(),
        }
      );
      await createPost(
        "To the barista at the campus coffee cart who wrote 'You got this' on my espresso cup before my organic chemistry midterm today: you are the reason I didn't cry in the lecture hall.",
        'Midterm Panda #77',
        '🐼',
        {
          label: 'POSITIVE',
          score: 0.98,
          model: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
          summary: 'High confidence positive tea (98.0%). Uplifting community experience.',
          vibe: '✨ Wholesome Campus Win',
          analyzedAt: new Date().toISOString(),
        }
      );
    } catch (e) {
      // Ignored if already created
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const res = await signInWithGoogle();
      setUser(res.user);
      setProfile(res.profile);
      setIsAnonymousRestricted(false);
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
    }
  };

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const query = searchQuery.toLowerCase().trim();
    return posts.filter(
      (p) =>
        p.content.toLowerCase().includes(query) ||
        p.authorAlias.toLowerCase().includes(query) ||
        p.sentiment?.vibe.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  return (
    <div className="min-h-screen bg-[#fcfaf7] text-[#1c1917] flex flex-col font-sans pb-16 md:pb-0">
      {/* Top Navigation */}
      <Navbar
        profile={profile}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCreatePost={() => setIsCreateOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onNavigateChat={() => setActiveView('chat')}
        onNavigateHome={() => setActiveView('feed')}
        activeView={activeView}
      />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 flex gap-6 lg:gap-8 justify-center">
        {/* Left Sidebar Navigation */}
        <SidebarNav
          currentTab={currentTab}
          onChangeTab={setCurrentTab}
          activeView={activeView}
          onSelectView={setActiveView}
          onOpenGuidelines={() => setIsGuidelinesOpen(true)}
          onOpenCreatePost={() => setIsCreateOpen(true)}
        />

        {/* Central View: Feed OR Live Chat */}
        {activeView === 'chat' ? (
          <LiveChatView
            profile={profile}
            onTriggerReport={(type, id) => setReportTarget({ type, id })}
            onOpenGuidelines={() => setIsGuidelinesOpen(true)}
          />
        ) : (
          <main className="flex-1 max-w-2xl w-full flex flex-col gap-4">
            {/* Anonymous Provider Notice Banner if Firebase Anonymous Auth is disabled */}
            {isAnonymousRestricted && !user && (
              <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 text-xs text-amber-950 flex flex-col gap-2.5 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-900">
                      Campus Anonymous Authentication Status
                    </p>
                    <p className="text-stone-700 leading-relaxed text-[11px]">
                      Anonymous Sign-in is not yet enabled in the Firebase Console. You can browse all campus tea freely! To spill tea or react:
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 pl-6">
                  <button
                    onClick={handleGoogleSignIn}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In with Google (Stay 100% Anonymous)</span>
                  </button>

                  <a
                    href="https://console.firebase.google.com/project/complete-dock-n4mm2/authentication/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:underline px-2 py-1"
                  >
                    <span>Enable Anonymous in Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={initAuth}
                    className="text-[11px] text-stone-600 hover:text-stone-900 px-2 py-1 underline cursor-pointer"
                  >
                    Retry Anonymous
                  </button>
                </div>
              </div>
            )}

            {/* Quick Share Banner / Post Composer Prompt */}
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-3.5 sm:p-4 flex items-center gap-3">
              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200/80 flex items-center justify-center text-lg select-none hover:scale-105 transition-transform cursor-pointer"
                title="Change anonymous alias"
              >
                {profile?.avatar || '🫖'}
              </button>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex-1 text-left bg-stone-50 hover:bg-stone-100/80 border border-stone-200/80 rounded-full px-4 py-2 text-xs sm:text-sm text-stone-500 hover:text-stone-700 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/30 cursor-pointer"
              >
                Spill campus tea, confessions, or gossip...
              </button>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Post</span>
              </button>
            </div>

            {/* Feed Sort Filter Header */}
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-1 bg-stone-200/60 p-1 rounded-xl">
                <button
                  onClick={() => setCurrentTab('recent')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    currentTab === 'recent'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Recent Tea
                </button>
                <button
                  onClick={() => setCurrentTab('popular')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    currentTab === 'popular'
                      ? 'bg-white text-orange-600 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Most Popular
                </button>
              </div>

              {searchQuery && (
                <div className="text-xs text-stone-500">
                  Showing results for &ldquo;{searchQuery}&rdquo; ({filteredPosts.length})
                </div>
              )}
            </div>

            {/* Error Message */}
            {feedError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{feedError}</span>
                </div>
                <button
                  onClick={() => {
                    setCurrentTab((t) => t);
                  }}
                  className="px-2.5 py-1 bg-white border border-rose-300 rounded-lg font-semibold text-[11px] hover:bg-rose-100"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Feed List */}
            {loadingPosts ? (
              <div className="py-16 flex flex-col items-center justify-center text-stone-400 gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-amber-600" />
                <p className="text-xs font-medium">Brewing campus tea feed...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200/80 p-10 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl">
                  ☕
                </div>
                <h3 className="font-bold text-stone-900 text-base">
                  {searchQuery ? 'No matching tea found' : 'No tea has been spilled yet'}
                </h3>
                <p className="text-xs text-stone-500 max-w-sm">
                  {searchQuery
                    ? 'Try searching for different keywords or clear the search bar.'
                    : 'Be the first anonymous campus student to drop a confession or gossip!'}
                </p>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Spill First Post
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.uid}
                    onTriggerReport={(type, id) => setReportTarget({ type, id })}
                    userAlias={profile?.alias}
                    userAvatar={profile?.avatar}
                  />
                ))}
              </div>
            )}
          </main>
        )}

        {/* Right Sidebar */}
        <RightSidebar
          profile={profile}
          onOpenFullChat={() => setActiveView('chat')}
          onOpenGuidelines={() => setIsGuidelinesOpen(true)}
          onTriggerReport={(type, id) => setReportTarget({ type, id })}
        />
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenCreatePost={() => setIsCreateOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        profile={profile}
      />

      {/* Modals */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        profile={profile}
        onPostCreated={() => {
          // Live onSnapshot listener updates the feed automatically
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentProfile={profile}
        onProfileUpdated={(up) => setProfile(up)}
      />

      {reportTarget && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}

      <CommunityGuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />
    </div>
  );
}
