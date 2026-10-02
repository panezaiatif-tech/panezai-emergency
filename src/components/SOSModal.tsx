import React, { useState, useEffect } from 'react';
import {
  X,
  PhoneCall,
  Flame,
  Shield,
  Hospital,
  Droplet,
  Wrench,
  MapPin,
  Users,
  Share2,
  Volume2,
  VolumeX,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { Coordinates, FamilyContact, SupportedLanguage } from '../types/emergency.ts';
import { TRANSLATIONS } from '../data/translations.ts';
import { buildEmergencyLocationMessage } from '../utils/geoUtils.ts';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  currentCoords: Coordinates | null;
  detectedLocationName?: string;
  familyContacts: FamilyContact[];
  onFindBlood: () => void;
  onFindMechanic: () => void;
  onFindHospital: () => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  isOpen,
  onClose,
  language,
  currentCoords,
  detectedLocationName,
  familyContacts,
  onFindBlood,
  onFindMechanic,
  onFindHospital,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [copied, setCopied] = useState(false);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [oscillator, setOscillator] = useState<OscillatorNode | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup audio context if playing
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, [audioCtx]);

  if (!isOpen) return null;

  const toggleSiren = () => {
    if (isSirenPlaying) {
      if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
      }
      setIsSirenPlaying(false);
    } else {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        // Modulate frequency like an emergency siren
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(2, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(300, ctx.currentTime);
        lfo.connect(osc.frequency);
        lfo.start();

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        setAudioCtx(ctx);
        setOscillator(osc);
        setIsSirenPlaying(true);
      } catch (e) {
        console.warn('AudioContext not allowed without gesture', e);
      }
    }
  };

  const shareText = buildEmergencyLocationMessage(currentCoords, detectedLocationName);

  const handleCopyLocation = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.location.href = url;
  };

  const handleSmsShare = () => {
    const url = `sms:?body=${encodeURIComponent(shareText)}`;
    window.location.href = url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#101A33] via-[#0B1327] to-[#070D1B] border-2 border-red-500/80 rounded-2xl shadow-2xl shadow-red-950/90 p-4 sm:p-6 text-white my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            if (isSirenPlaying) toggleSiren();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          aria-label="Close SOS"
        >
          <X className="w-6 h-6" />
        </button>

        {/* SOS Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600/30 border-2 border-red-500 text-red-500 mb-3 shadow-lg shadow-red-900/50 animate-pulse">
            <AlertTriangle className="w-9 h-9" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase flex items-center justify-center gap-2">
            <span>🚨</span> {t.sosTitle}
          </h2>
          <p className="text-red-300 text-sm font-semibold mt-1">
            {t.sosSubtitle} {detectedLocationName ? `· ${detectedLocationName}` : ''}
          </p>
        </div>

        {/* Primary Call Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* Ambulance Call */}
          <a
            href="tel:1122"
            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-950/60 border border-red-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-black/25 flex items-center justify-center text-2xl">
                🚑
              </div>
              <div className="text-left">
                <div className="text-xs uppercase tracking-wider text-red-200 font-bold">Rescue Emergency</div>
                <div className="text-xl font-black">{t.callAmbulance}</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono">1122</span>
              <div className="text-[11px] text-red-200">TAP TO CALL</div>
            </div>
          </a>

          {/* Police Call */}
          <a
            href="tel:15"
            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-950/60 border border-blue-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-black/25 flex items-center justify-center text-2xl">
                👮
              </div>
              <div className="text-left">
                <div className="text-xs uppercase tracking-wider text-blue-200 font-bold">Madadgar Police</div>
                <div className="text-xl font-black">{t.callPolice}</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono">15</span>
              <div className="text-[11px] text-blue-200">TAP TO CALL</div>
            </div>
          </a>

          {/* Fire Brigade Call */}
          <a
            href="tel:16"
            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg shadow-orange-950/60 border border-amber-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-black/25 flex items-center justify-center text-2xl">
                🚒
              </div>
              <div className="text-left">
                <div className="text-xs uppercase tracking-wider text-amber-200 font-bold">Fire Helpline</div>
                <div className="text-xl font-black">{t.callFire}</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono">16</span>
              <div className="text-[11px] text-amber-200">TAP TO CALL</div>
            </div>
          </a>

          {/* Edhi Ambulance Alternative */}
          <a
            href="tel:115"
            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-teal-950/60 border border-emerald-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-black/25 flex items-center justify-center text-2xl">
                🤍
              </div>
              <div className="text-left">
                <div className="text-xs uppercase tracking-wider text-emerald-200 font-bold">Edhi National</div>
                <div className="text-xl font-black">Edhi Ambulance</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono">115</span>
              <div className="text-[11px] text-emerald-200">TAP TO CALL</div>
            </div>
          </a>
        </div>

        {/* Secondary Services Actions */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          <button
            type="button"
            onClick={() => {
              onClose();
              onFindHospital();
            }}
            className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-center flex flex-col items-center justify-center gap-1.5 transition-all hover:border-slate-500"
          >
            <Hospital className="w-6 h-6 text-red-400" />
            <span className="text-xs font-bold leading-tight">{t.callHospital}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onFindBlood();
            }}
            className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-center flex flex-col items-center justify-center gap-1.5 transition-all hover:border-slate-500"
          >
            <Droplet className="w-6 h-6 text-rose-500" />
            <span className="text-xs font-bold leading-tight">{t.findBlood}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onFindMechanic();
            }}
            className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-center flex flex-col items-center justify-center gap-1.5 transition-all hover:border-slate-500"
          >
            <Wrench className="w-6 h-6 text-amber-400" />
            <span className="text-xs font-bold leading-tight">{t.findMechanic}</span>
          </button>
        </div>

        {/* Location & Family Alerts Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="text-sm font-bold text-slate-200">{t.shareLocation}</span>
            </div>
            {currentCoords && (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp Alert</span>
            </button>
            <button
              type="button"
              onClick={handleSmsShare}
              className="px-3 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <PhoneCall className="w-4 h-4" />
              <span>SMS Alert</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLocation}
              className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Link' : 'Copy GPS Link'}</span>
            </button>
          </div>
        </div>

        {/* Family Emergency Alert Quick Dial */}
        {familyContacts.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-300">
              <Users className="w-4 h-4 text-sky-400" />
              <span>{t.alertFamily}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {familyContacts.map((contact) => (
                <a
                  key={contact.id}
                  href={`tel:${contact.phone}`}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-xs"
                >
                  <div className="font-semibold text-slate-200">
                    {contact.name} <span className="text-slate-400">({contact.relation})</span>
                  </div>
                  <div className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5" />
                    {contact.phone}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Siren Sound Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <span>Audio Signal for search & rescue / night emergencies:</span>
          <button
            type="button"
            onClick={toggleSiren}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              isSirenPlaying
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isSirenPlaying ? (
              <>
                <VolumeX className="w-4 h-4" /> Stop Siren
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" /> Emergency Siren
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
