import React, { useState } from 'react';
import { X, Flag, Send, CheckCircle2 } from 'lucide-react';
import { EmergencyRecord, SupportedLanguage, UserReport } from '../types/emergency.ts';
import { TRANSLATIONS } from '../data/translations.ts';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: EmergencyRecord | null;
  onSubmitReport: (report: UserReport) => void;
  language: SupportedLanguage;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  record,
  onSubmitReport,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [reason, setReason] = useState<UserReport['reason']>('wrong_number');
  const [suggestedCorrection, setSuggestedCorrection] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: UserReport = {
      id: 'rep-' + Date.now(),
      recordId: record.id,
      organizationName: record.organization,
      reportedPhone: record.phone,
      location: `${record.city}, ${record.district}, ${record.province}`,
      reason,
      suggestedCorrection: suggestedCorrection.trim(),
      reporterPhone: reporterPhone.trim(),
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    };

    onSubmitReport(newReport);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#0C152B] border border-slate-700 rounded-2xl shadow-2xl p-5 sm:p-6 text-white my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-white">Report Submitted to Verification Admin</h3>
            <p className="text-xs text-slate-300">
              Thank you. Administrators will reverify this service number with official agency authorities.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center">
                <Flag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{t.reportIncorrect}</h3>
                <p className="text-xs text-slate-400 truncate max-w-xs">{record.organization}</p>
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="text-slate-400">Current Registered Number:</div>
              <div className="font-mono text-white font-bold text-sm">{record.phone}</div>
              <div className="text-slate-400 mt-1">Source: {record.officialSource}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nature of the Issue:
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="wrong_number">Wrong / Incorrect phone number</option>
                <option value="not_responding">Number rings but never responds</option>
                <option value="outdated_service">Facility closed / moved permanently</option>
                <option value="new_number_suggested">New direct helpline available</option>
                <option value="other">Other issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Suggested Correction or Details:
              </label>
              <textarea
                rows={3}
                required
                value={suggestedCorrection}
                onChange={(e) => setSuggestedCorrection(e.target.value)}
                placeholder="Provide corrected phone number, official notification link, or detail..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your Phone Number (Optional, for admin verification):
              </label>
              <input
                type="tel"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="0300-XXXXXXX"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-950/60"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Report</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
