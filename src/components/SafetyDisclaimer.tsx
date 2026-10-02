import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { SupportedLanguage } from '../types/emergency.ts';
import { TRANSLATIONS } from '../data/translations.ts';

interface SafetyDisclaimerProps {
  language: SupportedLanguage;
}

export const SafetyDisclaimer: React.FC<SafetyDisclaimerProps> = ({ language }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/60 border border-emerald-800/40 rounded-2xl p-4 sm:p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="flex-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <strong className="text-emerald-400 font-bold block sm:inline sm:mr-1">
            ⚠️ National Emergency Safety Protocol:
          </strong>
          {t.safetyNotice} Every listing carries official agency provenance, verified dates, and 24/7 readiness badges.
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            Audit Level: 100% Strict
          </span>
        </div>
      </div>
    </div>
  );
};
