import React, { useEffect, useState } from 'react';
import { Send, Loader2, Flag } from 'lucide-react';
import { subscribeToComments, addComment } from '../firebase/posts';
import { Comment } from '../types';
import { timeAgo } from '../utils/timeAgo';

interface CommentSectionProps {
  postId: string;
  authorAlias: string;
  authorAvatar: string;
  onCommentAdded: () => void;
  onTriggerReport: (type: 'comment', id: string) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  authorAlias,
  authorAvatar,
  onCommentAdded,
  onTriggerReport,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToComments(
      postId,
      (fetched) => {
        setComments(fetched);
        setIsLoading(false);
      },
      (err) => {
        console.error('Failed to subscribe to comments:', err);
        setError('Failed to load comments');
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newComment.trim();
    if (!clean || isSubmitting) return;

    if (clean.length > 300) {
      setError('Comments must be under 300 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addComment(postId, clean, authorAlias, authorAvatar);
      setNewComment('');
      onCommentAdded();
    } catch (err: any) {
      setError(err?.message || 'Could not post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-3 border-t border-stone-100 flex flex-col gap-3">
      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
        <div className="relative">
          <input
            type="text"
            placeholder="Add to the tea... (max 300 chars)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={300}
            className="w-full bg-stone-50 hover:bg-stone-100/70 focus:bg-white border border-stone-200/90 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-xs text-stone-800 placeholder-stone-400 rounded-xl px-3.5 py-2.5 pr-10 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-stone-400 px-1">
          <span>Commenting anonymously as {authorAvatar} {authorAlias}</span>
          <span className={newComment.length > 280 ? 'text-amber-600 font-semibold' : ''}>
            {newComment.length}/300
          </span>
        </div>

        {error && (
          <div className="flex items-center justify-between text-[11px] text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
            <span>{error}</span>
            {error.toLowerCase().includes('signed in') && (
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
      </form>

      {/* Comment List */}
      <div className="space-y-2 mt-1">
        {isLoading ? (
          <div className="py-4 flex justify-center text-stone-400">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-[11px] text-stone-400 text-center py-2 italic">
            No comments yet. Spill your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-stone-50/80 rounded-xl p-2.5 text-xs border border-stone-100 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm select-none">{comment.authorAvatar}</span>
                  <span className="font-semibold text-stone-800 text-[11px]">
                    {comment.authorAlias}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    • {timeAgo(comment.createdAt)}
                  </span>
                </div>
                <button
                  onClick={() => onTriggerReport('comment', comment.id)}
                  className="text-stone-300 hover:text-rose-500 transition-colors p-0.5"
                  title="Report comment"
                >
                  <Flag className="w-3 h-3" />
                </button>
              </div>
              <p className="text-stone-700 break-words pl-5 text-[11px] leading-relaxed">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
