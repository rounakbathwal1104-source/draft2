import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  increment,
  onSnapshot,
  deleteDoc,
  runTransaction,
} from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { Post, Comment, ReactionType, SentimentInsight, ReactionCounts } from '../types';

const INITIAL_REACTIONS: ReactionCounts = {
  spill: 0,
  ded: 0,
  sip: 0,
  flag: 0,
  mood: 0,
};

export async function createPost(
  content: string,
  authorAlias: string,
  authorAvatar: string,
  sentiment?: SentimentInsight
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be anonymously authenticated to spill tea.');

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 500) {
    throw new Error('Post content must be between 1 and 500 characters.');
  }

  const postsRef = collection(db, 'posts');
  const newPostDoc = doc(postsRef);
  const path = `posts/${newPostDoc.id}`;

  try {
    const postData: any = {
      authorId: user.uid,
      authorAlias: authorAlias.slice(0, 40),
      authorAvatar: authorAvatar.slice(0, 60),
      content: trimmed,
      commentCount: 0,
      reactionCounts: INITIAL_REACTIONS,
      createdAt: serverTimestamp(),
    };

    if (sentiment) {
      postData.sentiment = sentiment;
    }

    await setDoc(newPostDoc, postData);
    return newPostDoc.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePostSentiment(postId: string, sentiment: SentimentInsight): Promise<void> {
  const path = `posts/${postId}`;
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { sentiment });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToPosts(
  sortBy: 'recent' | 'popular',
  limitCount: number,
  onUpdate: (posts: Post[]) => void,
  onError: (error: any) => void
): () => void {
  const postsRef = collection(db, 'posts');
  // Order by createdAt descending for reliable live feed
  const q = query(postsRef, orderBy('createdAt', 'desc'), limit(limitCount));
  const path = 'posts';

  return onSnapshot(
    q,
    async (snapshot) => {
      const posts: Post[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          authorId: data.authorId,
          authorAlias: data.authorAlias || 'Anonymous',
          authorAvatar: data.authorAvatar || '🫖',
          content: data.content || '',
          createdAt: data.createdAt,
          commentCount: data.commentCount || 0,
          reactionCounts: {
            spill: data.reactionCounts?.spill || 0,
            ded: data.reactionCounts?.ded || 0,
            sip: data.reactionCounts?.sip || 0,
            flag: data.reactionCounts?.flag || 0,
            mood: data.reactionCounts?.mood || 0,
          },
          sentiment: data.sentiment,
        };
      });

      // If user requested 'popular', sort in-memory by total engagement score
      if (sortBy === 'popular') {
        posts.sort((a, b) => {
          const totalA =
            a.reactionCounts.spill * 2 +
            a.reactionCounts.ded +
            a.reactionCounts.sip +
            a.reactionCounts.mood +
            a.commentCount * 3;
          const totalB =
            b.reactionCounts.spill * 2 +
            b.reactionCounts.ded +
            b.reactionCounts.sip +
            b.reactionCounts.mood +
            b.commentCount * 3;
          return totalB - totalA;
        });
      }

      onUpdate(posts);
    },
    (err) => {
      console.warn('Posts listener notification:', err?.message || err);
      onError(err);
    }
  );
}

export async function getUserReaction(postId: string, userId: string): Promise<ReactionType | null> {
  const path = `posts/${postId}/reactions/${userId}`;
  try {
    const reactionRef = doc(db, 'posts', postId, 'reactions', userId);
    const snap = await getDoc(reactionRef);
    if (snap.exists()) {
      return (snap.data().reactionType as ReactionType) || null;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function togglePostReaction(
  postId: string,
  reactionType: ReactionType
): Promise<{ userReaction: ReactionType | null; newCounts: ReactionCounts }> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to react');

  const reactionDocRef = doc(db, 'posts', postId, 'reactions', user.uid);
  const postDocRef = doc(db, 'posts', postId);

  return await runTransaction(db, async (transaction) => {
    const postSnap = await transaction.get(postDocRef);
    if (!postSnap.exists()) {
      throw new Error('Post no longer exists');
    }

    const postData = postSnap.data();
    const currentCounts: ReactionCounts = {
      spill: postData.reactionCounts?.spill || 0,
      ded: postData.reactionCounts?.ded || 0,
      sip: postData.reactionCounts?.sip || 0,
      flag: postData.reactionCounts?.flag || 0,
      mood: postData.reactionCounts?.mood || 0,
    };

    const reactionSnap = await transaction.get(reactionDocRef);
    let finalUserReaction: ReactionType | null = null;

    if (reactionSnap.exists()) {
      const prevType = reactionSnap.data().reactionType as ReactionType;
      if (prevType === reactionType) {
        // Remove reaction
        transaction.delete(reactionDocRef);
        currentCounts[prevType] = Math.max(0, currentCounts[prevType] - 1);
        finalUserReaction = null;
      } else {
        // Change reaction type
        transaction.set(reactionDocRef, {
          userId: user.uid,
          reactionType,
          createdAt: serverTimestamp(),
        });
        currentCounts[prevType] = Math.max(0, currentCounts[prevType] - 1);
        currentCounts[reactionType] = (currentCounts[reactionType] || 0) + 1;
        finalUserReaction = reactionType;
      }
    } else {
      // Add new reaction
      transaction.set(reactionDocRef, {
        userId: user.uid,
        reactionType,
        createdAt: serverTimestamp(),
      });
      currentCounts[reactionType] = (currentCounts[reactionType] || 0) + 1;
      finalUserReaction = reactionType;
    }

    transaction.update(postDocRef, {
      reactionCounts: currentCounts,
    });

    return { userReaction: finalUserReaction, newCounts: currentCounts };
  });
}

export async function addComment(
  postId: string,
  content: string,
  authorAlias: string,
  authorAvatar: string
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to comment');

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 300) {
    throw new Error('Comment must be between 1 and 300 characters');
  }

  const commentsCol = collection(db, 'posts', postId, 'comments');
  const newCommentDoc = doc(commentsCol);
  const postDocRef = doc(db, 'posts', postId);

  const path = `posts/${postId}/comments/${newCommentDoc.id}`;
  try {
    await setDoc(newCommentDoc, {
      postId,
      authorId: user.uid,
      authorAlias: authorAlias.slice(0, 40),
      authorAvatar: authorAvatar.slice(0, 60),
      content: trimmed,
      createdAt: serverTimestamp(),
    });

    await updateDoc(postDocRef, {
      commentCount: increment(1),
    });

    return newCommentDoc.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToComments(
  postId: string,
  onUpdate: (comments: Comment[]) => void,
  onError: (error: any) => void
): () => void {
  const commentsCol = collection(db, 'posts', postId, 'comments');
  const q = query(commentsCol, orderBy('createdAt', 'asc'));
  const path = `posts/${postId}/comments`;

  return onSnapshot(
    q,
    (snapshot) => {
      const comments: Comment[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          postId,
          authorId: data.authorId,
          authorAlias: data.authorAlias || 'Anonymous',
          authorAvatar: data.authorAvatar || '🫖',
          content: data.content || '',
          createdAt: data.createdAt,
        };
      });
      onUpdate(comments);
    },
    (err) => {
      console.warn('Comments listener notification:', err?.message || err);
      onError(err);
    }
  );
}
