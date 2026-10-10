import React, { useState } from 'react';
import {
  MessageSquare,
  Share2,
  Flag,
  Sparkles,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Post, ReactionType, SentimentInsight } from '../types';
import { timeAgo } from '../utils/timeAgo';
import { togglePostReaction, updatePostSentiment } from '../firebase/posts';
import { analyzePostSentiment } from '../services/aiTeaInsights';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onTriggerReport: (type: 'post' | 'comment', id: string) => void;
  userAlias?: string;
  userAvatar?: string;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onTriggerReport,
  userAlias = 'Anonymous',
  userAvatar = '🫖',
}) => {
  const [reactionCounts, setReactionCounts] = useState(post.reactionCounts);
  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(post.userReaction || null);
  const [isReacting, setIsReacting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [copied, setCopied] = useState(false);

  // AI Sentiment State
  const [sentiment, setSentiment] = useState<SentimentInsight | undefined>(post.sentiment);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleReactionClick = async (type: ReactionType) => {
    if (isReacting) return;
    setIsReacting(true);

    // Optimistic UI update
    const prevCounts = { ...reactionCounts };
    const prevReaction = activeReaction;

    const nextCounts = { ...reactionCounts };
    let nextReaction: ReactionType | null = null;

    if (prevReaction === type) {
      nextCounts[type] = Math.max(0, nextCounts[type] - 1);
      nextReaction = null;
    } else {
      if (prevReaction) {
        nextCounts[prevReaction] = Math.max(0, nextCounts[prevReaction] - 1);
      }
      nextCounts[type] = (nextCounts[type] || 0) + 1;
      nextReaction = type;
    }

    setReactionCounts(nextCounts);
    setActiveReaction(nextReaction);

    try {
      const res = await togglePostReaction(post.id, type);
      setReactionCounts(res.newCounts);
      setActiveReaction(res.userReaction);
    } catch (err) {
      console.error('Reaction update failed, reverting:', err);
      setReactionCounts(prevCounts);
      setActiveReaction(prevReaction);
    } finally {
      setIsReacting(false);
    }
  };

  const handleAnalyzeSentiment = async () => {
    if (isAnalyzingAI || sentiment) return;
    setIsAnalyzingAI(true);
    setAiError(null);

    try {
      const insight = await analyzePostSentiment(post.content);
      setSentiment(insight);
      // Persist to Firestore post document so other students see the tea insight
      if (currentUserId) {
        try {
          await updatePostSentiment(post.id, insight);
        } catch (saveErr) {
          console.warn('Could not persist sentiment to Firestore:', saveErr);
        }
      }
    } catch (err: any) {
      setAiError(err.message || 'Could not run AI model inference.');
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`"${post.content}" — spilled anonymously on Eneyetea`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <article className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:border-amber-300/80 transition-all p-4 sm:p-5 flex flex-col gap-3">
      {/* Header: Author + Timestamp + Report */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200/80 flex items-center justify-center text-lg select-none">
            {post.authorAvatar}
          </div>
          <div>
            <span className="font-bold text-stone-900 block leading-tight">
              {post.authorAlias}
            </span>
            <span className="text-[11px] text-stone-500">
              {timeAgo(post.createdAt)}
            </span>
          </div>
        </div>

        <button
          onClick={() => onTriggerReport('post', post.id)}
          className="text-stone-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-stone-100"
          title="Report inappropriate post"
        >
          <Flag className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Content Body */}
      <div className="text-stone-800 text-[15px] sm:text-base leading-relaxed break-words whitespace-pre-wrap font-normal">
        {post.content}
      </div>

      {/* AI Tea Insights Section */}
      <div className="pt-0.5">
        {sentiment ? (
          <div className="rounded-xl p-2.5 bg-gradient-to-r from-amber-50/70 to-orange-50/50 border border-amber-200/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center gap-2">
              <span className="p-1 rounded-md bg-amber-100 text-amber-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              </span>
              <div>
                <span className="font-bold text-stone-900 mr-2">
                  {sentiment.vibe}
                </span>
                <span className="text-[11px] text-stone-500 hidden sm:inline">
                  {sentiment.summary}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-stone-500 shrink-0 self-end sm:self-auto font-mono">
              <span className="px-1.5 py-0.5 bg-white/90 rounded border border-stone-200/80 font-semibold text-stone-700">
                {sentiment.label} ({(sentiment.score * 100).toFixed(0)}%)
              </span>
              <span className="text-[9px] text-stone-400" title="Trained SST-2 classification model via Transformers.js">
                DistilBERT
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAnalyzeSentiment}
              disabled={isAnalyzingAI}
              className="text-[11px] text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg px-2.5 py-1 flex items-center gap-1.5 font-medium transition-all disabled:opacity-60 cursor-pointer"
            >
              {isAnalyzingAI ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-amber-700" />
                  <span>Running in-browser AI inference...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Get AI Tea Insight</span>
                </>
              )}
            </button>
            {aiError && (
              <span className="text-[10px] text-rose-600 truncate">{aiError}</span>
            )}
          </div>
        )}
      </div>

      {/* Reaction and Interaction Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
        {/* Reactions: Spill, Ded, Sip, Flag, Mood */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5 max-w-full">
          {/* Spill */}
          <button
            onClick={() => handleReactionClick('spill')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              activeReaction === 'spill'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 ring-1 ring-amber-300/40 shadow-2xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/60'
            }`}
            title="Spill the tea"
          >
            <span>🫖</span>
            <span className="text-[11px]">{reactionCounts.spill}</span>
          </button>

          {/* Ded */}
          <button
            onClick={() => handleReactionClick('ded')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              activeReaction === 'ded'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 ring-1 ring-amber-300/40 shadow-2xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/60'
            }`}
            title="Ded / Hilarious"
          >
            <span>💀</span>
            <span className="text-[11px]">{reactionCounts.ded}</span>
          </button>

          {/* Sip */}
          <button
            onClick={() => handleReactionClick('sip')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              activeReaction === 'sip'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 ring-1 ring-amber-300/40 shadow-2xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/60'
            }`}
            title="Sip / Listening intently"
          >
            <span>🍵</span>
            <span className="text-[11px]">{reactionCounts.sip}</span>
          </button>

          {/* Flag */}
          <button
            onClick={() => handleReactionClick('flag')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              activeReaction === 'flag'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 ring-1 ring-amber-300/40 shadow-2xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/60'
            }`}
            title="Red Flag / Drama"
          >
            <span>🚩</span>
            <span className="text-[11px]">{reactionCounts.flag}</span>
          </button>

          {/* Mood */}
          <button
            onClick={() => handleReactionClick('mood')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              activeReaction === 'mood'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 ring-1 ring-amber-300/40 shadow-2xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/60'
            }`}
            title="Big Mood / Relatable"
          >
            <span>🔥</span>
            <span className="text-[11px]">{reactionCounts.mood}</span>
          </button>
        </div>

        {/* Right Action: Comments & Share */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Comments toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              showComments
                ? 'bg-stone-200 text-stone-900'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{commentCount}</span>
            {showComments ? (
              <ChevronUp className="w-3 h-3 text-stone-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-stone-400" />
            )}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-colors relative"
            title="Copy post snippet"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Comment Section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          authorAlias={userAlias}
          authorAvatar={userAvatar}
          onCommentAdded={() => setCommentCount((c) => c + 1)}
          onTriggerReport={onTriggerReport}
        />
      )}
    </article>
  );
};
