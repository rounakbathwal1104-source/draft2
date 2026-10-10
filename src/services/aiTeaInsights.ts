import { pipeline, env } from '@xenova/transformers';
import { SentimentInsight } from '../types';

// Ensure transformers loads remote ONNX weights from Hugging Face hub and caches them locally
env.allowLocalModels = false;
env.useBrowserCache = true;

export const MODEL_ID = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
export const MODEL_FRAMEWORK = 'Hugging Face Transformers.js (ONNX Runtime Web)';
export const MODEL_LICENSE = 'Apache-2.0';
export const MODEL_CLASSES = ['POSITIVE', 'NEGATIVE'] as const;

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ModelProgress {
  status: ModelStatus;
  progressPercent: number;
  statusMessage: string;
  error?: string;
}

let classifierPromise: Promise<any> | null = null;
let currentProgress: ModelProgress = {
  status: 'idle',
  progressPercent: 0,
  statusMessage: 'Model ready to load on demand',
};

const progressListeners: Array<(progress: ModelProgress) => void> = [];

export function subscribeToModelProgress(listener: (progress: ModelProgress) => void): () => void {
  progressListeners.push(listener);
  listener(currentProgress);
  return () => {
    const idx = progressListeners.indexOf(listener);
    if (idx !== -1) progressListeners.splice(idx, 1);
  };
}

function updateProgress(patch: Partial<ModelProgress>) {
  currentProgress = { ...currentProgress, ...patch };
  for (const listener of progressListeners) {
    try {
      listener(currentProgress);
    } catch (e) {
      console.error('Error notifying progress listener', e);
    }
  }
}

// In-memory cache so we don't re-run inference on the exact same post text
const sentimentCache = new Map<string, SentimentInsight>();

export async function getClassifierInstance(): Promise<any> {
  if (classifierPromise) {
    return classifierPromise;
  }

  updateProgress({
    status: 'loading',
    progressPercent: 10,
    statusMessage: 'Initializing open-source DistilBERT model...',
  });

  classifierPromise = (async () => {
    try {
      const pipe = await pipeline('text-classification', MODEL_ID, {
        quantized: true,
        progress_callback: (data: any) => {
          if (data.status === 'progress' && data.total) {
            const percent = Math.min(99, Math.round((data.loaded / data.total) * 100));
            updateProgress({
              status: 'loading',
              progressPercent: percent,
              statusMessage: `Downloading model weights: ${percent}%`,
            });
          } else if (data.status === 'initiate') {
            updateProgress({
              status: 'loading',
              progressPercent: 20,
              statusMessage: `Loading ${data.file || 'weights'}...`,
            });
          } else if (data.status === 'done') {
            updateProgress({
              status: 'loading',
              progressPercent: 95,
              statusMessage: 'Finalizing ONNX Runtime execution graph...',
            });
          }
        },
      });

      updateProgress({
        status: 'ready',
        progressPercent: 100,
        statusMessage: 'DistilBERT SST-2 model ready (cached)',
      });

      return pipe;
    } catch (err: any) {
      classifierPromise = null;
      const errorMessage = err?.message || 'Failed to download or initialize Transformers.js model.';
      updateProgress({
        status: 'error',
        progressPercent: 0,
        statusMessage: 'Model loading failed',
        error: errorMessage,
      });
      throw new Error(`AI Model Error: ${errorMessage}`);
    }
  })();

  return classifierPromise;
}

export async function analyzePostSentiment(text: string): Promise<SentimentInsight> {
  const clean = text.trim();
  if (!clean) {
    throw new Error('Cannot analyze empty content');
  }

  if (sentimentCache.has(clean)) {
    return sentimentCache.get(clean)!;
  }

  const classifier = await getClassifierInstance();
  const rawResults = await classifier(clean);
  // Hugging Face Transformers.js returns an array of { label: 'POSITIVE' | 'NEGATIVE', score: number }
  const topResult = Array.isArray(rawResults) ? rawResults[0] : rawResults;

  const label = (topResult.label === 'POSITIVE' || topResult.label === 'NEGATIVE')
    ? (topResult.label as 'POSITIVE' | 'NEGATIVE')
    : 'NEGATIVE';
  const score = Math.round(Number(topResult.score) * 1000) / 1000;

  // Determine Campus Tea Vibe based strictly on the model output class and confidence
  let vibe = '';
  let summary = '';

  if (label === 'POSITIVE') {
    if (score >= 0.85) {
      vibe = '✨ Wholesome Campus Win';
      summary = `High confidence positive tea (${(score * 100).toFixed(1)}%). Uplifting community experience.`;
    } else {
      vibe = '🍵 Mild Good Vibes';
      summary = `Moderate positive sentiment (${(score * 100).toFixed(1)}%). Gentle or nuanced campus story.`;
    }
  } else {
    if (score >= 0.85) {
      vibe = '🔥 Spicy Drama / High Rant';
      summary = `Strong negative sentiment (${(score * 100).toFixed(1)}%). Expressing high campus frustration or tea spill.`;
    } else {
      vibe = '👀 Venting / Questionable Tea';
      summary = `Mild negative sentiment (${(score * 100).toFixed(1)}%). Typical campus venting or skeptical opinion.`;
    }
  }

  const insight: SentimentInsight = {
    label,
    score,
    model: MODEL_ID,
    summary,
    vibe,
    analyzedAt: new Date().toISOString(),
  };

  sentimentCache.set(clean, insight);
  return insight;
}
