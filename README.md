# Eneyetea (🫖) — Anonymous Campus Community

> *"Spill the unverified tea."*

**Eneyetea** is a full-stack, anonymous campus community web application where college students can share confessions, campus gossip, funny lab incidents, unpopular opinions, and relatable stories. Inspired by Reddit's usability but built with original Eneyetea branding, warm aesthetics, genuine Firebase persistence, real-time campus chat, and browser-native open-source AI sentiment inference.

---

## 🌟 Core Features

1. **One Unified Campus Feed**
   - No fragmented subreddits, arbitrary topic categories, or tab walls.
   - Instant post publishing with zero review or approval queue delays.
   - Real-time post updates across devices via Firebase Cloud Firestore snapshot listeners.
   - Sorting by **Recent Tea** (chronological) and **Most Popular** (weighted engagement score).
   - Real-time text search across confessions, authors, and AI vibes.

2. **Anonymous Identity Management**
   - Backed by **Firebase Anonymous Authentication**.
   - Auto-assigned campus aliases (e.g., `Sleepy Otter #29`, `Caffeinated Chemist #14`) and cute tea-themed avatars.
   - Customizable anonymous alias without ever requesting student emails, real names, or phone numbers.
   - Session persistence across reloads with transparent disclosures: anonymous accounts are private, not guaranteed untraceable.

3. **Unique Five Reactions System**
   - **🫖 Spill**: Acknowledge a great scoop of campus tea.
   - **💀 Ded**: Hilarious or shocking confessions.
   - **🍵 Sip**: Listening closely / intriguing perspective.
   - **🚩 Flag**: Major red flag or drama alert.
   - **🔥 Mood**: Painfully relatable campus moment.
   - **Anti-Inflation Protection**: Individual reaction records stored under `posts/{postId}/reactions/{userId}` preventing duplicate votes.

4. **Threaded Comments**
   - Real-time comments subcollection with a 300-character limit.
   - Instant updates without page refreshes.

5. **Live Campus Chat**
   - Real-time messaging lounge powered by Firestore listeners.
   - 280-character limit per message.
   - 2.5-second anti-spam sending cooldown with animated countdown.
   - Bounded message history with automatic scroll-to-bottom.
   - Report controls directly on chat messages.

6. **Open-Source AI Feature: AI Tea Insights**
   - Real browser-native inference using **Hugging Face Transformers.js** and **ONNX Runtime Web**.
   - **Model**: `Xenova/distilbert-base-uncased-finetuned-sst-2-english` (quantized ONNX).
   - **License**: Apache 2.0 (Open-source verified).
   - **Classes**: Real binary classification (`POSITIVE` / `NEGATIVE`) with confidence percentages (no invented classes).
   - Generates contextual campus vibe tags (`✨ Wholesome Campus Win`, `🔥 Spicy Drama / High Rant`, `🍵 Mild Good Vibes`, `👀 Venting`).
   - Lazy model loading with progress indicators and local browser caching.
   - Posts are never censored or suppressed based on sentiment.

7. **Safety & Private Reporting**
   - Users can report posts, comments, and chat messages.
   - Reason categories: Harassment, Personal Info / Doxxing, Threats, Sexual Harassment, Spam, Other.
   - Reports are stored in a private Firestore `reports` collection: users can create reports, but ordinary clients can **never** read or query them.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite 8 |
| **Styling** | Tailwind CSS v4 (Warm off-white `#fcfaf7`, tea-orange accents) |
| **Icons & Animation** | Lucide React, Motion |
| **Backend & Database** | Firebase Cloud Firestore |
| **Authentication** | Firebase Anonymous Authentication |
| **In-Browser AI Engine** | Hugging Face Transformers.js v2 (`@xenova/transformers`) |
| **Model** | DistilBERT SST-2 English (`Xenova/distilbert-base-uncased-finetuned-sst-2-english`) |
| **Security** | Firestore Security Rules (`firestore.rules`) with deny-by-default ABAC |

---

## 🔒 Firestore Security Rules Overview

The application is protected by zero-trust Firestore Security Rules (`firestore.rules`):
- **Catch-all deny**: Default read and write blocked for all documents.
- **`posts/{postId}`**:
  - `read`: Authenticated users.
  - `create`: Enforces `authorId == request.auth.uid`, 1-500 char length, string constraints, and server timestamp.
  - `update`: Whitelisted to reaction counts, comment count increment, and sentiment data.
- **`posts/{postId}/reactions/{userId}`**:
  - Only the authenticated user matching `userId` can write their reaction.
  - Allowed reaction values: `['spill', 'ded', 'sip', 'flag', 'mood']`.
- **`posts/{postId}/comments/{commentId}`**:
  - Comment length validated to 1-300 characters.
  - Only author can delete their own comment; modifications denied.
- **`chat_messages/{messageId}`**:
  - 1-280 characters length constraint.
  - Immutable after creation.
- **`reports/{reportId}`**:
  - **`allow read: if false;`** (Strict private collection, zero user read access).
  - Validated reason enumeration.

---

## 🤖 Open-Source AI Model Details

- **Model Identifier**: `Xenova/distilbert-base-uncased-finetuned-sst-2-english`
- **Framework**: Hugging Face Transformers.js / ONNX Runtime Web
- **License**: Apache-2.0
- **Model Architecture**: DistilBERT (Transformer-based sentiment classification fine-tuned on the Stanford Sentiment Treebank)
- **Model Classes**: `POSITIVE`, `NEGATIVE`
- **Inference Mode**: Client-side WebAssembly / Web Workers in the browser without third-party paid API keys.

---

## 🚀 Local Development

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Run Typecheck & Linting**:
   ```bash
   npm run lint
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

---

## ☁️ Deployment Instructions

### Google AI Studio / Cloud Run (One-Click)
This applet is pre-configured with Google AI Studio. Changes deployed automatically to the preview and shared URLs.

### Manual Vercel / Netlify / Firebase Hosting:
1. Connect your repository to Vercel or Netlify.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Deploy Firestore Rules using Firebase CLI if deploying to a custom project:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## 📋 Hackathon 3-Minute Presentation Script

- **[0:00 - 0:35] The Hook**:
  "College campuses have tons of raw, relatable moments every single day — from 8 AM organic chemistry disasters to dorm drama and campus coffee shoutouts. But current social media is tied to real names or clunky subreddits with moderator queues. Meet **Eneyetea**: the anonymous campus community where you can spill the tea instantly."

- **[0:35 - 1:20] The Live Feed & Reactions Demo**:
  "Notice the unified feed — no topic tabs or approval delays. We assign every user an anonymous campus identity backed by Firebase Anonymous Auth. Check out our five custom campus reactions: Spill, Ded, Sip, Flag, and Mood. Each reaction is stored individually in Firestore to guarantee zero vote manipulation."

- **[1:20 - 2:05] Open-Source AI Tea Insights**:
  "Here’s where Eneyetea goes beyond traditional forums: our **AI Tea Insights** feature. Using Hugging Face Transformers.js and ONNX Runtime Web, we run a quantized DistilBERT model entirely inside the student’s browser with zero paid API tokens! It analyzes the emotional sentiment, assigns confidence scores, and flags the vibe — like '✨ Wholesome Campus Win' or '🔥 Spicy Drama'."

- **[2:05 - 2:40] Live Campus Chat & Privacy**:
  "We also have a dedicated **Live Campus Chat** room with real-time updates and anti-spam cooldowns. And for safety, we implement strict private reporting rules in Firestore where only moderators can access filed flags."

- **[2:40 - 3:00] Conclusion**:
  "Eneyetea is fast, private, real-time, and powered by genuine open-source browser AI. Thank you!"
