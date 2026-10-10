import React, { useState } from 'react';
import { X, Sparkles, Loader2, Send, AlertCircle, Coffee } from 'lucide-react';
import { createPost } from '../firebase/posts';
import { analyzePostSentiment } from '../services/aiTeaInsights';
import { SentimentInsight, UserProfile } from '../types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onPostCreated: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  profile,
  onPostCreated,
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-spill sentiment analysis
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [previewSentiment, setPreviewSentiment] = useState<SentimentInsight | null>(null);

  if (!isOpen) return null;

  const handlePreAnalyze = async () => {
    if (!content.trim() || analyzingAI) return;
    setAnalyzingAI(true);
    setError(null);
    try {
      const insight = await analyzePostSentiment(content.trim());
      setPreviewSentiment(insight);
    } catch (err: any) {
      setError(err?.message || 'Could not analyze with AI');
    } finally {
      setAnalyzingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = content.trim();
    if (!clean) {
      setError('Please write some tea before spilling.');
      return;
    }
    if (clean.length > 500) {
      setError('Tea content exceeds the 500 character limit.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const alias = profile?.alias || 'Anonymous Campus Student';
      const avatar = profile?.avatar || '🫖';
      await createPost(clean, alias, avatar, previewSentiment || undefined);
      setContent('');
      setPreviewSentiment(null);
      onPostCreated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to post tea. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-[#fdfbf7]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-sm">Spill Campus Tea</h2>
              <p className="text-[11px] text-stone-500">
                Instant publishing • No approval queue • Anonymous identity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3">
          {/* Identity info */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50/70 rounded-xl border border-amber-200/60 text-xs text-amber-900">
            <span className="text-base">{profile?.avatar || '🫖'}</span>
            <span className="font-semibold">{profile?.alias || 'Anonymous Student'}</span>
            <span className="text-[11px] text-amber-700/80 ml-auto font-mono">
              Auto-assigned session
            </span>
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              rows={4}
              maxLength={500}
              placeholder="What's the tea? Confessions, campus gossip, funny lab incidents, unpopular opinions... (max 500 chars)"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (previewSentiment) setPreviewSentiment(null); // Reset preview on edit
              }}
              className="w-full p-3.5 bg-stone-50 hover:bg-stone-100/50 focus:bg-white border border-stone-200 rounded-2xl text-stone-900 text-sm placeholder-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all resize-none"
              autoFocus
            />
            <div className="flex items-center justify-between text-xs text-stone-400 px-1 pt-1">
              <button
                type="button"
                onClick={handlePreAnalyze}
                disabled={!content.trim() || analyzingAI}
                className="text-[11px] text-amber-700 hover:text-amber-900 flex items-center gap-1 font-semibold disabled:opacity-40"
              >
                {analyzingAI ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                    <span>DistilBERT inference running...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>AI Sentiment Preview</span>
                  </>
                )}
              </button>
              <span className={`font-mono ${content.length > 450 ? 'text-amber-600 font-bold' : ''}`}>
                {content.length}/500
              </span>
            </div>
          </div>

          {/* Sentiment Preview Banner */}
          {previewSentiment && (
            <div className="rounded-xl p-2.5 bg-amber-50/90 border border-amber-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold text-stone-900 block">{previewSentiment.vibe}</span>
                  <span className="text-[10px] text-stone-600">{previewSentiment.summary}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-white rounded border border-amber-300 font-mono text-[10px] font-bold text-stone-700">
                {previewSentiment.label} ({(previewSentiment.score * 100).toFixed(0)}%)
              </span>
            </div>
          )}

          {error && (
            <div className="flex flex-col gap-2 bg-rose-50 p-3 rounded-xl border border-rose-200">
              <div className="flex items-center gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
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
                  className="self-start text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Sign in with Google (Your Alias Stays 100% Anonymous)
                </button>
              )}
            </div>
          )}

          {/* Guidelines Note */}
          <p className="text-[11px] text-stone-400 leading-tight">
            Please refrain from doxxing private individuals or hate speech. Posts publish instantly across devices.
          </p>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 text-white text-xs font-bold rounded-full shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Spill Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
