import {
  collection,
  doc,
  setDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { ChatMessage } from '../types';

let lastSentTimestamp = 0;
const SEND_COOLDOWN_MS = 2500; // 2.5 seconds cooldown

export function getCooldownRemaining(): number {
  const elapsed = Date.now() - lastSentTimestamp;
  if (elapsed >= SEND_COOLDOWN_MS) return 0;
  return Math.ceil((SEND_COOLDOWN_MS - elapsed) / 1000);
}

export async function sendChatMessage(
  content: string,
  authorAlias: string,
  authorAvatar: string
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be authenticated to chat.');

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 280) {
    throw new Error('Message must be between 1 and 280 characters.');
  }

  const now = Date.now();
  if (now - lastSentTimestamp < SEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((SEND_COOLDOWN_MS - (now - lastSentTimestamp)) / 1000);
    throw new Error(`Chat cooldown: please wait ${waitSec}s before sending another message.`);
  }

  const chatCol = collection(db, 'chat_messages');
  const newMsgDoc = doc(chatCol);
  const path = `chat_messages/${newMsgDoc.id}`;

  try {
    await setDoc(newMsgDoc, {
      authorId: user.uid,
      authorAlias: authorAlias.slice(0, 40),
      authorAvatar: authorAvatar.slice(0, 60),
      content: trimmed,
      createdAt: serverTimestamp(),
    });

    lastSentTimestamp = Date.now();
    return newMsgDoc.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToChatMessages(
  onUpdate: (messages: ChatMessage[]) => void,
  onError: (error: any) => void
): () => void {
  const chatCol = collection(db, 'chat_messages');
  // Order by createdAt ascending, limited to last 80 messages for fast rendering
  const q = query(chatCol, orderBy('createdAt', 'desc'), limit(80));
  const path = 'chat_messages';

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            authorId: data.authorId,
            authorAlias: data.authorAlias || 'Campus Ghost',
            authorAvatar: data.authorAvatar || '🫖',
            content: data.content || '',
            createdAt: data.createdAt,
          };
        })
        .reverse(); // Display oldest to newest in chat feed

      onUpdate(messages);
    },
    (err) => {
      console.warn('Chat listener notification:', err?.message || err);
      onError(err);
    }
  );
}
