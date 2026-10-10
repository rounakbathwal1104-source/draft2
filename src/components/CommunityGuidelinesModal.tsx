import React from 'react';
import { X, Shield, Lock, Eye, AlertTriangle, Sparkles, Coffee } from 'lucide-react';
import { MODEL_ID, MODEL_LICENSE } from '../services/aiTeaInsights';

interface CommunityGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityGuidelinesModal: React.FC<CommunityGuidelinesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-[#fdfbf7]/90 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-sm">Community Guidelines & Principles</h2>
              <p className="text-[11px] text-stone-500">Keeping Eneyetea fun, raw, and safe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Guidelines Body */}
        <div className="p-5 space-y-4 text-xs text-stone-700">
          {/* Section 1: Anonymity Disclaimer */}
          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/70 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>Anonymity & Privacy Disclosure</span>
            </div>
            <p className="leading-relaxed text-stone-600">
              Eneyetea uses Firebase Anonymous Authentication so you don’t have to register your real name, student email, or phone number.
              However, <strong>anonymous accounts are not equivalent to guaranteed, untraceable anonymity</strong>. Lawful network records and Firestore security policies are maintained to prevent illicit behavior.
            </p>
          </div>

          {/* Section 2: Zero Tolerance */}
          <div className="space-y-2">
            <h3 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Zero Tolerance Rules</span>
            </h3>
            <ul className="space-y-1.5 pl-4 list-disc marker:text-rose-500 text-stone-600 leading-relaxed">
              <li>
                <strong>No Doxxing:</strong> Do not post personal cell numbers, dorm addresses, private phone numbers, or the full names of non-public figures.
              </li>
              <li>
                <strong>No Targeted Harassment:</strong> Healthy venting about campus life is welcome; targeted threats or hate speech are not.
              </li>
              <li>
                <strong>Instant Publishing:</strong> Posts publish immediately without a review queue. Respect the community trust.
              </li>
            </ul>
          </div>

          {/* Section 3: Open-Source AI Disclosure */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-stone-900 text-xs">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>AI Tea Insights Disclosure</span>
            </div>
            <p className="leading-relaxed text-stone-600">
              Our AI insights are powered by <strong>{MODEL_ID}</strong> using Hugging Face Transformers.js in WebAssembly/ONNX under the <strong>{MODEL_LICENSE}</strong> license.
            </p>
            <p className="leading-relaxed text-stone-500 text-[11px]">
              • Model classes: Positive or Negative sentiment estimates with confidence percentages.<br/>
              • <em>Posts are never deleted or censored solely based on AI sentiment classification.</em>
            </p>
          </div>

          {/* Section 4: Reactions */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-amber-600" />
              <span>The Five Reactions</span>
            </h3>
            <p className="text-stone-600 leading-relaxed">
              • 🫖 <strong>Spill:</strong> Acknowledge a great scoop of tea.<br/>
              • 💀 <strong>Ded:</strong> Hilarious or shocking confession.<br/>
              • 🍵 <strong>Sip:</strong> Listening closely / intriguing perspective.<br/>
              • 🚩 <strong>Flag:</strong> Major red flag or drama alert.<br/>
              • 🔥 <strong>Mood:</strong> Painfully relatable campus feeling.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-5 py-3 border-t border-stone-100 bg-[#fdfbf7] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full font-bold text-xs transition-colors"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
