import React, { useState, useEffect, useRef } from 'react';
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
  X,
  Send,
  MapPin,
  Hospital,
  Users,
  Share2,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import type {
  Coordinates,
  EmergencyRecord,
  SupportedLanguage,
  VoiceAssistantResponse,
} from '../types/emergency.ts';
import { buildEmergencyLocationMessage } from '../utils/geoUtils.ts';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  currentCoords: Coordinates | null;
  detectedLocationName?: string;
  onCallNumber: (phone: string, name?: string) => void;
  onTriggerSos: () => void;
  onFindHospital: () => void;
  onOpenFamily: () => void;
}

const COMMON_VOICE_QUERIES = [
  'I need an ambulance.',
  'What is the police emergency number?',
  'Find the nearest hospital.',
  'My car has broken down.',
  'There has been an accident.',
  'I need a fire brigade.',
  'Someone is injured.',
  'I need a blood bank.',
  'What should I do in this emergency?',
  'Find emergency services near me.',
];

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  language,
  currentCoords,
  detectedLocationName,
  onCallNumber,
  onTriggerSos,
  onFindHospital,
  onOpenFamily,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [copiedLocation, setCopiedLocation] = useState(false);

  // Latest assistant response
  const [assistantResult, setAssistantResult] = useState<VoiceAssistantResponse | null>(null);

  // Conversation history in modal
  const [chatHistory, setChatHistory] = useState<
    { sender: 'user' | 'assistant'; text: string; time: string }[]
  >([]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = true;
      recog.lang = language === 'ur' ? 'ur-PK' : language === 'ps' ? 'ps-AF' : 'en-US';

      recog.onresult = (event: any) => {
        let current = '';
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
      };

      recog.onend = () => {
        setIsRecording(false);
      };

      recog.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsRecording(false);
      };

      setRecognition(recog);
    }
  }, [language]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isThinking]);

  if (!isOpen) return null;

  // Speak voice output using SpeechSynthesis
  const speakText = (text: string) => {
    if (audioMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'ur' ? 'ur-PK' : 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleToggleRecord = () => {
    stopSpeaking();
    if (isRecording) {
      recognition?.stop();
      setIsRecording(false);
      if (transcript) {
        handleProcessMessage(transcript);
      }
    } else {
      setTranscript('');
      try {
        recognition?.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Recognition start failed:', err);
      }
    }
  };

  const handleProcessMessage = async (userQuery: string) => {
    if (!userQuery.trim() || isThinking) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatHistory((prev) => [...prev, { sender: 'user', text: userQuery, time: timeStr }]);
    setInputText('');
    setTranscript('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/voice-assistant-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userQuery,
          language,
          userLocation: {
            coords: currentCoords,
            locationName: detectedLocationName,
          },
        }),
      });

      const data: VoiceAssistantResponse = await res.json();
      setAssistantResult(data);

      setChatHistory((prev) => [
        ...prev,
        { sender: 'assistant', text: data.spokenReply, time: timeStr },
      ]);

      speakText(data.spokenReply);
    } catch (err) {
      console.warn('Voice assistant error:', err);
      const fallbackReply =
        'Panezai Emergency Network: In any critical emergency, please dial Rescue 1122 or Police 15 directly.';
      setAssistantResult({
        spokenReply: fallbackReply,
        isEmergencyMode: true,
        matchedRecords: [],
        suggestedActions: ['ambulance', 'police', 'hospital', 'location', 'family'],
      });
      speakText(fallbackReply);
    } finally {
      setIsThinking(false);
    }
  };

  const handleShareGps = () => {
    const msg = buildEmergencyLocationMessage(currentCoords, detectedLocationName);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg);
      setCopiedLocation(true);
      setTimeout(() => setCopiedLocation(false), 2500);
    }
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#0F1B38] via-[#0B1428] to-[#070D1B] border-2 border-emerald-500/80 rounded-3xl shadow-2xl p-4 sm:p-6 text-white my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 border border-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950">
                <Mic className={`w-5 h-5 ${isSpeaking ? 'animate-bounce text-emerald-200' : ''}`} />
              </div>
              {isSpeaking && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping"></span>
              )}
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Panezai AI Voice Emergency Assistant</span>
                <span className="text-[10px] font-extrabold uppercase text-emerald-300 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                  Live Voice
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Natural speech in Urdu, English & Pashto · Zero-hallucination verified database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Voice Mute Toggle */}
            <button
              type="button"
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setAudioMuted(!audioMuted);
              }}
              className={`p-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                audioMuted
                  ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={audioMuted ? 'Voice Muted' : 'Voice Active'}
            >
              {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================
            EMERGENCY CONVERSATION MODE BANNER (When Emergency Detected)
           ======================================================== */}
        {assistantResult?.isEmergencyMode && (
          <div className="bg-gradient-to-r from-red-950/95 via-[#230914] to-red-950/95 border-2 border-red-500 rounded-2xl p-3 sm:p-4 my-2.5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                <span>🚨 EMERGENCY CONVERSATION MODE ACTIVE</span>
              </span>
              <span className="text-[11px] text-slate-300 font-mono">
                {detectedLocationName || 'Universal Pakistan Dispatch'}
              </span>
            </div>

            <p className="text-xs text-red-200 mb-2.5 font-medium">
              Immediate action buttons below. For life-safety emergencies, dial 1122 or 15 immediately.
            </p>

            {/* Instant Action Triage 5-Button Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onCallNumber('1122', 'Rescue 1122 Ambulance')}
                className="py-2.5 px-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex flex-col items-center justify-center gap-1 shadow-md shadow-red-950 cursor-pointer"
              >
                <span className="text-base">🚑</span>
                <span className="leading-none">Call 1122</span>
                <span className="text-[9px] text-red-200 font-normal">Ambulance</span>
              </button>

              <button
                type="button"
                onClick={() => onCallNumber('15', 'Police 15')}
                className="py-2.5 px-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-extrabold text-xs flex flex-col items-center justify-center gap-1 shadow-md shadow-blue-950 cursor-pointer"
              >
                <span className="text-base">👮</span>
                <span className="leading-none">Call 15</span>
                <span className="text-[9px] text-blue-200 font-normal">Police</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  onClose();
                  onFindHospital();
                }}
                className="py-2.5 px-2 rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 border border-rose-700 cursor-pointer"
              >
                <span className="text-base">🏥</span>
                <span className="leading-none">ER / Hospital</span>
                <span className="text-[9px] text-rose-300 font-normal">Trauma Room</span>
              </button>

              <button
                type="button"
                onClick={handleShareGps}
                className="py-2.5 px-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow cursor-pointer"
              >
                <span className="text-base">{copiedLocation ? '✅' : '📍'}</span>
                <span className="leading-none">{copiedLocation ? 'Copied' : 'Share GPS'}</span>
                <span className="text-[9px] text-emerald-200 font-normal">Live Location</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  onClose();
                  onOpenFamily();
                }}
                className="py-2.5 px-2 rounded-xl bg-sky-800 hover:bg-sky-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 border border-sky-700 cursor-pointer col-span-2 sm:col-span-1"
              >
                <span className="text-base">👨‍👩‍👧</span>
                <span className="leading-none">Alert Family</span>
                <span className="text-[9px] text-sky-200 font-normal">Contacts</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            NEARBY SERVICES FILTER CHIPS (Quick Access)
           ======================================================== */}
        <div className="py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-thin text-xs border-b border-slate-800/80">
          <span className="text-slate-400 text-[10px] font-bold flex-shrink-0 flex items-center gap-1 pl-1">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>Nearby:</span>
          </span>
          {[
            { label: '🏥 Hospitals', query: 'Find nearest hospital emergency' },
            { label: '🚑 Ambulances', query: 'I need an ambulance' },
            { label: '👮 Police', query: 'What is the police emergency number?' },
            { label: '🚒 Fire Stations', query: 'I need a fire brigade' },
            { label: '🩸 Blood Banks', query: 'I need a blood bank' },
            { label: '💊 Pharmacies', query: 'Find emergency pharmacy' },
            { label: '🛠️ Mechanics', query: 'My car has broken down' },
            { label: '🚗 Towing', query: 'I need roadside towing assistance' },
            { label: '🆘 Rescue Services', query: 'Find emergency services near me' },
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleProcessMessage(item.query)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/60 text-slate-300 hover:text-white whitespace-nowrap text-[11px] flex-shrink-0 cursor-pointer transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Quick Voice Prompt Chips */}
        <div className="py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-thin text-xs border-b border-slate-800/60">
          <span className="text-slate-400 text-[10px] font-bold flex-shrink-0 flex items-center gap-1 pl-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Try saying:</span>
          </span>
          {COMMON_VOICE_QUERIES.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleProcessMessage(q)}
              className="px-2.5 py-0.5 rounded-md bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200 whitespace-nowrap text-[10px] flex-shrink-0 cursor-pointer"
            >
              "{q}"
            </button>
          ))}
        </div>

        {/* Chat / Voice Conversation History */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {chatHistory.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500/60 text-emerald-400 flex items-center justify-center mx-auto text-2xl animate-pulse">
                🎙️
              </div>
              <h4 className="text-base font-bold text-white">Speak Naturally to Your Emergency Assistant</h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Tap the microphone below and speak in Urdu, English, or Pashto. Ask for an ambulance, report an accident, find the nearest hospital, or request breakdown help.
              </p>
            </div>
          ) : (
            chatHistory.map((item, idx) => {
              const isUser = item.sender === 'user';
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-br-none shadow font-medium'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none shadow'
                    }`}
                  >
                    {item.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{item.time}</span>
                </div>
              );
            })
          )}

          {isThinking && (
            <div className="flex items-center gap-2 p-3 bg-slate-900/90 rounded-2xl w-fit border border-slate-800 text-xs text-slate-300">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Retrieving verified Pakistan emergency records...</span>
            </div>
          )}

          {/* ========================================================
              ON-SCREEN VERIFIED SERVICE CARDS WITH ALL REQUIRED FIELDS
              SERVICE, ORGANIZATION, PHONE NUMBER, LOCATION, VERIFICATION STATUS,
              LAST VERIFIED DATE, DISTANCE, ADDRESS, CALL NOW, DIRECTIONS
             ======================================================== */}
          {assistantResult?.matchedRecords && assistantResult.matchedRecords.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Verified Emergency Facilities Found ({assistantResult.matchedRecords.length}):
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>100% Zero-Guessed Records</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {assistantResult.matchedRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-2xl bg-[#091224] border border-slate-800 flex flex-col justify-between shadow-xl space-y-3"
                  >
                    <div className="space-y-1.5">
                      {/* Top Row: Service Category & Verification Status */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-800 uppercase tracking-wider">
                          SERVICE: {rec.category}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                          <ShieldCheck className="w-3 h-3" />
                          <span>STATUS: {rec.verificationStatus}</span>
                        </span>
                      </div>

                      {/* Organization Name */}
                      <h5 className="font-black text-white text-sm sm:text-base leading-snug">
                        {rec.organization}
                      </h5>

                      {/* Phone Number Display */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-xs text-slate-400 font-bold uppercase">PHONE:</span>
                        <span className="text-sm font-mono font-black text-emerald-300 tracking-wider">
                          {rec.phone}
                        </span>
                        {rec.altPhone && (
                          <span className="text-xs font-mono text-slate-400">
                            / {rec.altPhone}
                          </span>
                        )}
                      </div>

                      {/* Location Information */}
                      <div className="text-[11px] text-slate-300 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-white">LOCATION: </strong>
                          <span>
                            {[rec.area, rec.city, rec.district, rec.province]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                          {rec.address && (
                            <span className="text-slate-400 block text-[10px] mt-0.5">
                              {rec.address}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Distance & Availability Info */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 pt-0.5">
                        {rec.distanceKm !== undefined && (
                          <span className="text-emerald-400 font-bold">
                            📍 {rec.distanceKm} km away
                          </span>
                        )}
                        <span>
                          {rec.is24_7 ? '🟢 Open 24/7' : '🕒 Regular Hours'}
                        </span>
                        <span>
                          Last Verified: <strong>{rec.verificationDate || 'Recent'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: 📞 CALL NOW & 🗺️ DIRECTIONS */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onCallNumber(rec.phone, rec.organization)}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-red-950 cursor-pointer transition-all"
                      >
                        <PhoneCall className="w-4 h-4 animate-bounce" />
                        <span>CALL NOW</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (rec.coordinates) {
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${rec.coordinates.lat},${rec.coordinates.lng}`;
                            window.open(url, '_blank');
                          } else {
                            const q = encodeURIComponent(`${rec.organization} ${rec.city} Pakistan`);
                            const url = `https://www.google.com/maps/search/?api=1&query=${q}`;
                            window.open(url, '_blank');
                          }
                        }}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all"
                      >
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <span>DIRECTIONS</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              EMERGENCY GUIDANCE STEPS ON SCREEN
             ======================================================== */}
          {assistantResult?.guidance && assistantResult.guidance.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-xs">
              <div className="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                <Info className="w-4 h-4" />
                <span>General Emergency Guidance (While Help Is Being Contacted):</span>
              </div>
              <ul className="space-y-1 text-slate-200">
                {assistantResult.guidance.map((step, sIdx) => (
                  <li key={sIdx} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-800 italic">
                * General guidance only. Does not replace professional medical, police, or rescue personnel.
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Live Audio Transcript display while user is speaking */}
        {isRecording && (
          <div className="bg-red-950/40 border border-red-500/60 rounded-2xl p-3 my-2 text-left">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span>Listening Live to Your Voice...</span>
            </div>
            <p className="text-sm text-white font-semibold italic">
              "{transcript || 'Listening to your speech...'}"
            </p>
          </div>
        )}

        {/* Bottom Live Mic & Input Bar */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            {/* Live Mic Toggle Button */}
            <button
              type="button"
              onClick={handleToggleRecord}
              className={`p-3.5 rounded-2xl flex items-center justify-center text-white transition-all cursor-pointer shadow-xl ${
                isRecording
                  ? 'bg-red-600 animate-pulse scale-105 shadow-red-950 border-2 border-red-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950 border border-emerald-400/50'
              }`}
              title={isRecording ? 'Stop Recording' : 'Start Live Voice Chat'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Typing input fallback */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleProcessMessage(inputText);
              }}
              placeholder="Or type emergency (e.g. I need an ambulance in Lahore)..."
              className="flex-1 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
            />

            <button
              type="button"
              disabled={!inputText.trim() || isThinking}
              onClick={() => handleProcessMessage(inputText)}
              className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold cursor-pointer shadow-lg transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Language: {language === 'ur' ? 'اردو' : language === 'ps' ? 'پښتو' : 'English'}</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-hallucination verified database</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
