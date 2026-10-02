import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneCall,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  CheckCircle,
  X,
} from 'lucide-react';
import { Coordinates, SupportedLanguage, VoiceIntakeResult } from '../types/emergency.ts';

interface VoiceEmergencyListenerProps {
  language: SupportedLanguage;
  currentCoords: Coordinates | null;
  detectedLocationName?: string;
  onCallNumber: (phone: string, name?: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_SPEECHES = [
  'Bolan Pass par gaari ka accident hua hai, ambulance aur rescue chahiye!',
  'Lahore Gulberg mein building mein aag lagi hai, fire brigade bhejen!',
  'Quetta Civil Hospital ke paas robbery hui hai, police 15 chahiye.',
  'Motorway M-2 par tyre burst ho gaya hai, highway help chahiye.',
  'Peshawar Lady Reading Hospital ke liye O-Negative blood donor chahiye.',
];

export const VoiceEmergencyListener: React.FC<VoiceEmergencyListenerProps> = ({
  language,
  currentCoords,
  detectedLocationName,
  onCallNumber,
  isOpen,
  onClose,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [intakeResult, setIntakeResult] = useState<VoiceIntakeResult | null>(null);
  const [isSpeakingAdvice, setIsSpeakingAdvice] = useState(false);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = true;
      recog.lang = language === 'ur' ? 'ur-PK' : 'en-US';

      recog.onresult = (event: any) => {
        let current = '';
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setSpokenTranscript(current);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recog.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      setRecognition(recog);
    }
  }, [language]);

  if (!isOpen) return null;

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
      if (spokenTranscript) {
        processSpeech(spokenTranscript);
      }
    } else {
      setIntakeResult(null);
      setSpokenTranscript('');
      try {
        recognition?.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const processSpeech = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/emergency-listen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speechText: text,
          language,
          userLocation: {
            coords: currentCoords,
            area: detectedLocationName,
          },
        }),
      });

      const data: VoiceIntakeResult = await res.json();
      setIntakeResult(data);

      // Speak back reassuring advice using Web SpeechSynthesis
      if ('speechSynthesis' in window && data.spokenAdvice) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(data.spokenAdvice);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsSpeakingAdvice(true);
        utterance.onend = () => setIsSpeakingAdvice(false);
        utterance.onerror = () => setIsSpeakingAdvice(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn('Process speech error:', err);
      setIntakeResult({
        originalSpeech: text,
        detectedUrgency: 'HIGH',
        detectedCategory: 'Rescue Services',
        recommendedNumber: '1122',
        recommendedService: 'Rescue 1122 Universal Helpline',
        spokenAdvice:
          'Emergency reported. Please dial Rescue 1122 immediately for urgent assistance.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestSample = (sample: string) => {
    setSpokenTranscript(sample);
    processSpeech(sample);
  };

  const stopSpeakingAdvice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeakingAdvice(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#0F1B38] via-[#0B1428] to-[#070D1B] border-2 border-emerald-500/80 rounded-3xl shadow-2xl p-5 sm:p-7 text-white my-auto">
        <button
          type="button"
          onClick={() => {
            stopSpeakingAdvice();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Voice Emergency Listener</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            “Tell Me Your Emergency, I Am Listening”
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Speak naturally in Urdu, English, or Pashto. The system recognizes your crisis and immediately prepares the verified call.
          </p>
        </div>

        {/* Big Microphone Tap Button */}
        <div className="flex flex-col items-center justify-center my-6">
          <button
            type="button"
            onClick={toggleListening}
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center gap-2 text-white shadow-2xl transition-all cursor-pointer ${
              isListening
                ? 'bg-red-600 animate-pulse scale-110 shadow-red-950/90 border-4 border-red-400'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/80 border-4 border-emerald-400/50 hover:scale-105'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-10 h-10 animate-bounce" />
                <span className="text-[10px] font-black uppercase tracking-wider">Listening...</span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10" />
                <span className="text-[10px] font-black uppercase tracking-wider">Tap to Speak</span>
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 mt-3 font-medium">
            {isListening ? 'Speak now into your microphone...' : 'Tap once and describe your emergency'}
          </p>
        </div>

        {/* Speech Transcript Output Box */}
        {(spokenTranscript || isListening) && (
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 mb-4 text-left">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
              Captured Narrative:
            </div>
            <p className="text-sm font-semibold text-white leading-relaxed">
              "{spokenTranscript || 'Listening to your voice...'}"
            </p>
            {isListening && (
              <button
                type="button"
                onClick={toggleListening}
                className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
              >
                Analyze Emergency Now
              </button>
            )}
          </div>
        )}

        {isProcessing && (
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-xs text-slate-300 mb-4">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>AI is identifying recommended service, urgency, and verified numbers...</span>
          </div>
        )}

        {/* Analyzed Emergency Result & Instant 1-Tap Call */}
        {intakeResult && (
          <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-red-950/40 border-2 border-red-500/80 rounded-2xl p-4 sm:p-5 mb-4 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded bg-red-600 text-white shadow">
                {intakeResult.detectedUrgency} URGENCY
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                {intakeResult.detectedCategory}
              </span>
            </div>

            <h4 className="text-lg font-black text-white mb-1">
              {intakeResult.recommendedService}
            </h4>

            <div className="bg-black/40 p-3 rounded-xl border border-white/10 text-xs text-slate-200 mb-4 leading-relaxed">
              <div className="flex items-center justify-between mb-1">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" /> Dispatcher Advice:
                </span>
                {isSpeakingAdvice && (
                  <button
                    type="button"
                    onClick={stopSpeakingAdvice}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Stop Audio
                  </button>
                )}
              </div>
              <p>{intakeResult.spokenAdvice}</p>
            </div>

            {/* Huge Direct Call Button */}
            <button
              type="button"
              onClick={() => {
                stopSpeakingAdvice();
                onCallNumber(intakeResult.recommendedNumber, intakeResult.recommendedService);
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-red-950 cursor-pointer transition-all"
            >
              <PhoneCall className="w-5 h-5 animate-bounce" />
              <span>CALL {intakeResult.recommendedNumber} NOW</span>
            </button>
          </div>
        )}

        {/* Quick Sample Voice Inputs */}
        <div className="pt-2 border-t border-slate-800 text-left">
          <span className="text-[11px] text-slate-400 block mb-2 font-medium">
            Or test with common emergency scenarios:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_SPEECHES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTestSample(sample)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-left truncate max-w-full"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
