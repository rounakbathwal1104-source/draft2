import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { submitReport } from '../firebase/reports';
import { ReportReason, ReportPayload } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment' | 'chat';
  targetId: string;
}

const REASON_OPTIONS: { label: string; value: ReportReason; desc: string }[] = [
  {
    label: 'Harassment & Bullying',
    value: 'harassment',
    desc: 'Targeted attacks, degradation, or malicious insults towards students.',
  },
  {
    label: 'Personal Information / Doxxing',
    value: 'personal_info',
    desc: 'Phone numbers, dorm room numbers, real full names, or private credentials.',
  },
  {
    label: 'Threats & Physical Harm',
    value: 'threats',
    desc: 'Threats of violence, self-harm, or dangerous campus behavior.',
  },
  {
    label: 'Sexual Harassment',
    value: 'sexual_harassment',
    desc: 'Unsolicited explicit content or non-consensual sexual gossip.',
  },
  {
    label: 'Spam or Commercial Promotion',
    value: 'spam',
    desc: 'Promotional bot links, repetitive spamming, or fraudulent scams.',
  },
  {
    label: 'Other Violations',
    value: 'other',
    desc: 'Any other serious violation of campus community standards.',
  },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
}) => {
  const [reason, setReason] = useState<ReportReason>('harassment');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: ReportPayload = {
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      };

      await submitReport(payload);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-[#fdfbf7]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-sm">
                Report {targetType === 'post' ? 'Tea Post' : targetType === 'chat' ? 'Chat Message' : 'Comment'}
              </h2>
              <p className="text-[11px] text-stone-500">
                Confidential report saved to private moderation collection
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

        {/* Content */}
        {success ? (
          <div className="p-8 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900 text-base">Report Submitted</h3>
            <p className="text-xs text-stone-600 max-w-xs">
              Thank you for keeping Eneyetea safe. Our moderation team reviews reports securely.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-2">
                Reason for reporting:
              </label>
              <div className="space-y-1.5">
                {REASON_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      reason === opt.value
                        ? 'border-amber-500 bg-amber-50/60 text-stone-900'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={opt.value}
                      checked={reason === opt.value}
                      onChange={() => setReason(opt.value)}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-semibold block">{opt.label}</span>
                      <span className="text-[11px] text-stone-500">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={2}
                maxLength={300}
                placeholder="Provide any additional context (max 300 chars)..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full p-2.5 bg-stone-50 focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-900 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-rose-600 text-xs bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-full shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Confidential Report</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
