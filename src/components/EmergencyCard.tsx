import React, { useState } from 'react';
import {
  PhoneCall,
  MapPin,
  ShieldCheck,
  Clock,
  ExternalLink,
  Flag,
  Share2,
  Copy,
  Check,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import { EmergencyRecord, SupportedLanguage } from '../types/emergency.ts';
import { TRANSLATIONS, CATEGORY_TRANSLATIONS } from '../data/translations.ts';
import { getDirectionsUrl } from '../utils/geoUtils.ts';

interface EmergencyCardProps {
  record: EmergencyRecord;
  language: SupportedLanguage;
  onReportIssue: (record: EmergencyRecord) => void;
}

export const EmergencyCard: React.FC<EmergencyCardProps> = ({
  record,
  language,
  onReportIssue,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const catNames = CATEGORY_TRANSLATIONS[language] || CATEGORY_TRANSLATIONS.en;
  const [copied, setCopied] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(record.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = `🚨 Emergency Contact:\n${record.organization}\n📞 Phone: ${record.phone}${
      record.altPhone ? ` | ${record.altPhone}` : ''
    }\n📍 Location: ${record.city}, ${record.district}, ${record.province}\nCategory: ${
      record.category
    }\nVerified via Panezai Emergency Network`;
    if (navigator.share) {
      navigator.share({ title: record.organization, text }).catch(() => {});
    } else {
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.location.href = url;
    }
  };

  const statusBadge = () => {
    if (record.verificationStatus === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>✅ {t.verified}</span>
        </span>
      );
    }
    if (record.verificationStatus === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-md">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>⚠️ {t.pendingVerification}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 rounded-md">
        <span>❌ {t.outdated}</span>
      </span>
    );
  };

  const categoryLabel = catNames[record.category] || record.category;

  return (
    <div className="group relative bg-[#0C152B] border border-slate-800 hover:border-slate-700/90 rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/40 transition-all flex flex-col justify-between">
      {/* Top Meta Line: Category & Status */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
            {categoryLabel}
          </span>
          <div className="flex items-center gap-2">
            {record.is24_7 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{t.hours24_7}</span>
              </span>
            )}
            {statusBadge()}
          </div>
        </div>

        {/* Organization Name & Location */}
        <h3 className="text-base sm:text-lg font-bold text-white leading-snug group-hover:text-emerald-300 transition-colors">
          {record.organization}
        </h3>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1 mb-3">
          <span className="flex items-center gap-1 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <span className="font-semibold">{record.city}</span>
            {record.area && <span>({record.area})</span>}
          </span>
          <span>·</span>
          <span>{record.district}</span>
          <span>·</span>
          <span className="text-slate-400">{record.province}</span>

          {record.distanceKm !== undefined && (
            <span className="ml-auto font-mono text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded text-[11px]">
              {record.distanceKm} km away
            </span>
          )}
        </div>

        {record.address && (
          <p className="text-xs text-slate-400 mb-3 line-clamp-1">{record.address}</p>
        )}

        {record.notes && (
          <p className="text-xs text-slate-300/80 bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/60 mb-4 italic">
            "{record.notes}"
          </p>
        )}
      </div>

      {/* Primary Actions: Big Call Button & Alt Phone */}
      <div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
          {/* Main Call Button */}
          <a
            href={`tel:${record.phone}`}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:from-red-700 active:to-red-800 text-white font-extrabold text-sm sm:text-base py-3 px-4 rounded-xl shadow-lg shadow-red-950/70 border border-red-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <PhoneCall className="w-5 h-5 animate-pulse" />
            <span>{t.callNow}:</span>
            <span className="font-mono text-lg tracking-wide">{record.phone}</span>
          </a>

          {/* Alternative Phone if exists */}
          {record.altPhone && (
            <a
              href={`tel:${record.altPhone}`}
              className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold font-mono transition-colors"
              title="Call Alternative Line"
            >
              <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
              <span>Alt: {record.altPhone}</span>
            </a>
          )}
        </div>

        {/* Utility Buttons: Directions, Copy, Share, Report */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            {record.coordinates ? (
              <a
                href={getDirectionsUrl(record.coordinates.lat, record.coordinates.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                title="Google Maps Navigation"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.directions}</span>
              </a>
            ) : null}

            <button
              type="button"
              onClick={handleCopyPhone}
              className="flex items-center gap-1 hover:text-slate-200 transition-colors cursor-pointer"
              title="Copy number"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1 hover:text-slate-200 transition-colors cursor-pointer"
              title="Share contact"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={record.officialSource}>
              {record.officialSource}
            </span>
            <button
              type="button"
              onClick={() => onReportIssue(record)}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              title={t.reportIncorrect}
            >
              <Flag className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
