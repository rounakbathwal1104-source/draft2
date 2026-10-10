export type ReactionType = 'spill' | 'ded' | 'sip' | 'flag' | 'mood';

export interface ReactionCounts {
  spill: number;
  ded: number;
  sip: number;
  flag: number;
  mood: number;
}

export interface SentimentInsight {
  label: 'POSITIVE' | 'NEGATIVE';
  score: number;
  model: string;
  summary: string;
  vibe: string;
  analyzedAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorAlias: string;
  authorAvatar: string;
  content: string;
  createdAt: any; // Firestore Timestamp
  commentCount: number;
  reactionCounts: ReactionCounts;
  sentiment?: SentimentInsight;
  // UI helper for current user's reaction
  userReaction?: ReactionType | null;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorAlias: string;
  authorAvatar: string;
  content: string;
  createdAt: any;
}

export interface ChatMessage {
  id: string;
  authorId: string;
  authorAlias: string;
  authorAvatar: string;
  content: string;
  createdAt: any;
}

export type ReportReason =
  | 'harassment'
  | 'personal_info'
  | 'threats'
  | 'spam'
  | 'sexual_harassment'
  | 'other';

export interface ReportPayload {
  targetType: 'post' | 'comment' | 'chat';
  targetId: string;
  reason: ReportReason;
  details?: string;
}

export interface UserProfile {
  alias: string;
  avatar: string;
}
