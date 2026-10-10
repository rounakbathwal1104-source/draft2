import {
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { UserProfile } from '../types';

const ADJECTIVES = [
  'Sleepy', 'Caffeinated', 'Midterm', 'Sneaky', 'Campus', 'Late-Night',
  'Library', 'Spicy', 'Chill', 'Honor-Roll', 'Procrastinating', 'Boba-Loving',
  'Dorm-Floor', 'Wired', 'Low-Key', 'Curious', 'Stealthy', 'Overthinking'
];

const NOUNS = [
  'Barista', 'Otter', 'Panda', 'Chemist', 'Fox', 'Coder', 'Owl',
  'Sloth', 'Scholar', 'Badger', 'Pigeon', 'Penguin', 'Falcon', 'Raccoon',
  'Avocado', 'Scribe', 'Freshman', 'Senior', 'Night-Owl'
];

export const AVATAR_OPTIONS = [
  '🫖', '🍵', '☕', '🦊', '🦉', '🐼', '🦦', '🦝', '🐧', '⚡', '🌙', '🍂', '✨', '🔥'
];

export function generateRandomAlias(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${adj} ${noun} #${num}`;
}

export function generateRandomAvatar(): string {
  return AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
}

const LOCAL_STORAGE_ALIAS_KEY = 'eneyetea_user_alias';
const LOCAL_STORAGE_AVATAR_KEY = 'eneyetea_user_avatar';

export function getLocalCachedProfile(): UserProfile {
  const savedAlias = localStorage.getItem(LOCAL_STORAGE_ALIAS_KEY);
  const savedAvatar = localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY);
  return {
    alias: savedAlias || generateRandomAlias(),
    avatar: savedAvatar || generateRandomAvatar(),
  };
}

export async function setupUserProfile(user: User): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', user.uid);
  let profile: UserProfile;

  try {
    const snapshot = await getDoc(userDocRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      profile = {
        alias: data.alias || generateRandomAlias(),
        avatar: data.avatar || generateRandomAvatar(),
      };
    } else {
      const cached = getLocalCachedProfile();
      profile = cached;
      await setDoc(userDocRef, {
        alias: profile.alias,
        avatar: profile.avatar,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    profile = getLocalCachedProfile();
  }

  localStorage.setItem(LOCAL_STORAGE_ALIAS_KEY, profile.alias);
  localStorage.setItem(LOCAL_STORAGE_AVATAR_KEY, profile.avatar);
  return profile;
}

export interface AuthInitResult {
  user: User | null;
  profile: UserProfile;
  isAnonymousRestricted?: boolean;
  errorMessage?: string;
}

export async function ensureAnonymousAuth(): Promise<AuthInitResult> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      unsubscribe();
      try {
        if (currentUser) {
          const profile = await setupUserProfile(currentUser);
          resolve({ user: currentUser, profile });
          return;
        }

        // Attempt anonymous sign-in
        try {
          const cred = await signInAnonymously(auth);
          const profile = await setupUserProfile(cred.user);
          resolve({ user: cred.user, profile });
        } catch (anonErr: any) {
          const isRestricted =
            anonErr?.code === 'auth/admin-restricted-operation' ||
            anonErr?.message?.includes('admin-restricted-operation');

          const fallbackProfile = getLocalCachedProfile();
          resolve({
            user: null,
            profile: fallbackProfile,
            isAnonymousRestricted: isRestricted,
            errorMessage: anonErr?.message,
          });
        }
      } catch (error: any) {
        resolve({
          user: null,
          profile: getLocalCachedProfile(),
          errorMessage: error?.message,
        });
      }
    });
  });
}

export async function signInWithGoogle(): Promise<{ user: User; profile: UserProfile }> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const profile = await setupUserProfile(cred.user);
  return { user: cred.user, profile };
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export async function updateUserProfile(newAlias: string, newAvatar: string): Promise<UserProfile> {
  const user = auth.currentUser;
  const trimmedAlias = newAlias.trim().slice(0, 32);
  if (trimmedAlias.length < 2) {
    throw new Error('Alias must be at least 2 characters');
  }

  localStorage.setItem(LOCAL_STORAGE_ALIAS_KEY, trimmedAlias);
  localStorage.setItem(LOCAL_STORAGE_AVATAR_KEY, newAvatar);

  if (user) {
    const path = `users/${user.uid}`;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          alias: trimmedAlias,
          avatar: newAvatar,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  return { alias: trimmedAlias, avatar: newAvatar };
}
