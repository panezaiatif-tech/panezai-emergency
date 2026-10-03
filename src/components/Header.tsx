import React from 'react';
import { ShieldCheck, PhoneCall, Globe, Users, Database, Mic, MessageCircle, Phone } from 'lucide-react';
import { SupportedLanguage } from '../types/emergency.ts';
import { TRANSLATIONS } from '../data/translations.ts';
import { PanezaiLogo } from './PanezaiLogo.tsx';

interface HeaderProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onOpenSos: () => void;
  onOpenFamily: () => void;
  onOpenAdmin: () => void;
  onOpenVoiceListener: () => void;
  lastSyncTime: string;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  onOpenSos,
  onOpenFamily,
  onOpenAdmin,
  onOpenVoiceListener,
  lastSyncTime,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const isRtl = language === 'ur' || language === 'ps';

  const formattedDate = new Date(lastSyncTime).toLocaleDateString(
    language === 'ur' ? 'ur-PK' : 'en-PK',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  return (
    <header className="border-b border-slate-800 bg-[#091122]/95 backdrop-blur sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
          {/* Logo & Brand with PanezaiLogo Vector Emblem */}
          <div className="flex items-center gap-3">
            <PanezaiLogo size="md" showText={false} />

            <div className={isRtl ? 'text-right' : 'text-left'}>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-white leading-tight">
                  {t.appTitle}
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded shadow">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  VERIFIED
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 font-medium hidden sm:block">
                {t.tagline} <span className="text-emerald-400 font-bold">· {t.creatorBadge}</span>
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Talk to AI Voice Assistant Button */}
            <button
              type="button"
              onClick={onOpenVoiceListener}
              className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950 border border-emerald-400/50"
              title="Talk to AI Voice Emergency Assistant"
            >
              <Mic className="w-4 h-4 text-emerald-200 animate-bounce" />
              <span className="hidden sm:inline">🎙️ AI Voice Assistant</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1.5 rounded transition-all ${
                  language === 'en'
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('ur')}
                className={`px-2 py-1.5 rounded transition-all font-nastaliq ${
                  language === 'ur'
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="اردو"
              >
                اردو
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('ps')}
                className={`px-2 py-1.5 rounded transition-all font-nastaliq ${
                  language === 'ps'
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="پښتو"
              >
                پښتو
              </button>
            </div>

            {/* Family Emergency Contacts Button */}
            <button
              type="button"
              onClick={onOpenFamily}
              className="p-2 sm:px-3 sm:py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={t.familyContactsTitle}
            >
              <Users className="w-4 h-4 text-sky-400" />
              <span className="hidden xl:inline">{t.familyContactsTitle}</span>
            </button>

            {/* Admin Portal Button */}
            <button
              type="button"
              onClick={onOpenAdmin}
              className="p-2 sm:px-2.5 sm:py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={t.adminTab}
            >
              <Database className="w-4 h-4 text-amber-400" />
            </button>

            {/* Pulsing High-Contrast SOS Button */}
            <button
              type="button"
              onClick={onOpenSos}
              className="relative group flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs sm:text-sm px-3.5 sm:px-4 py-2.5 rounded-xl shadow-lg shadow-red-950/80 border border-red-400/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span className="animate-ping absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-400 opacity-75"></span>
              <PhoneCall className="w-4 h-4 animate-bounce" />
              <span>{t.sosButton}</span>
            </button>
          </div>
        </div>

        {/* Offline & Sync Status Ribbon */}
        <div className="py-1 px-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{t.offlineStatus} (Free Offline Voice SIM Calling Active)</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>{t.lastSync}:</span>
            <span className="font-mono text-slate-300">{formattedDate}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
