import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  PhoneCall,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  Heart,
  Flame,
  Car,
  Wrench,
  Search,
} from 'lucide-react';
import type { EmergencyGuidanceTopic, SupportedLanguage } from '../types/emergency.ts';
import { EMERGENCY_GUIDANCE_TOPICS, GUIDANCE_LOCALIZED } from '../data/emergencyGuidance.ts';

interface EmergencyGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  onCallNumber: (phone: string, name?: string) => void;
}

export const EmergencyGuidanceModal: React.FC<EmergencyGuidanceModalProps> = ({
  isOpen,
  onClose,
  language,
  onCallNumber,
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(EMERGENCY_GUIDANCE_TOPICS[0].id);

  if (!isOpen) return null;

  const currentTopic =
    EMERGENCY_GUIDANCE_TOPICS.find((t) => t.id === selectedTopicId) ||
    EMERGENCY_GUIDANCE_TOPICS[0];

  const localizedSummary =
    GUIDANCE_LOCALIZED[language]?.[currentTopic.id] ||
    GUIDANCE_LOCALIZED.en[currentTopic.id];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-[#0F1B38] via-[#0B1428] to-[#070D1B] border-2 border-amber-500/80 rounded-3xl shadow-2xl p-4 sm:p-6 text-white my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-lg">
              📖
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>National Emergency Guidance & First-Aid Manual</span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Actionable step-by-step guidance while emergency services are on their way
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer Ribbon */}
        <div className="my-3 p-3 bg-amber-950/60 border border-amber-600/50 rounded-2xl flex items-start gap-2.5 text-xs text-amber-200">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Important Safety Notice:</strong> This guidance contains general emergency first-aid and safety information. It does NOT replace professional paramedics, physicians, firefighters, or police officers. For life-threatening emergencies, prioritize calling <strong>1122</strong> or <strong>15</strong> immediately.
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Topic Selector List */}
          <div className="space-y-2 overflow-y-auto pr-1 max-h-52 md:max-h-none">
            {EMERGENCY_GUIDANCE_TOPICS.map((topic) => {
              const isSelected = topic.id === selectedTopicId;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white font-bold shadow-lg shadow-amber-950'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl">{topic.icon}</span>
                    <span className="text-xs truncate">{topic.title}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-70" />
                </button>
              );
            })}
          </div>

          {/* Active Topic Content */}
          <div className="md:col-span-2 overflow-y-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  {currentTopic.category}
                </span>
                <h4 className="text-lg font-black text-white mt-1">
                  {currentTopic.title}
                </h4>
              </div>

              {/* Direct call button for this emergency */}
              <button
                type="button"
                onClick={() =>
                  onCallNumber(
                    currentTopic.verifiedContact.number,
                    currentTopic.verifiedContact.service
                  )
                }
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-red-950 cursor-pointer flex-shrink-0"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call {currentTopic.verifiedContact.number}</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              {currentTopic.summary}
            </p>

            {/* Immediate Actions */}
            <div>
              <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>1. Immediate Life-Safety Actions:</span>
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {currentTopic.immediateActions.map((act, i) => (
                  <li key={i} className="flex items-start gap-2 bg-black/25 p-2 rounded-xl border border-white/5">
                    <span className="font-bold text-emerald-400 font-mono">{i + 1}.</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* While Waiting */}
            <div>
              <h5 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-sky-400" />
                <span>2. While Waiting for Emergency Responders:</span>
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {currentTopic.whileWaiting.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 bg-black/25 p-2 rounded-xl border border-white/5">
                    <span className="text-sky-400 font-bold">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What to tell responders */}
            <div>
              <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-amber-400" />
                <span>3. What Information to Give Emergency Dispatchers:</span>
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {currentTopic.whatToTellResponders.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 bg-black/25 p-2 rounded-xl border border-white/5">
                    <span className="text-amber-400 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Safety Warnings */}
            {currentTopic.safetyWarnings.length > 0 && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-2xl text-xs text-red-200">
                <div className="font-bold text-red-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Critical Warnings:
                </div>
                {currentTopic.safetyWarnings.map((warn, i) => (
                  <p key={i} className="mb-0.5">• {warn}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
