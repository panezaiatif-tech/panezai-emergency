import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, ShieldCheck, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Coordinates, SupportedLanguage } from '../types/emergency.ts';
import { TRANSLATIONS } from '../data/translations.ts';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  currentCoords: Coordinates | null;
  detectedLocationName?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'I need an ambulance in Quetta',
  'What is the police emergency number?',
  'Find trauma hospital in Lahore',
  'Fire brigade in Karachi emergency',
  'Mechanic near me',
  'Bomb disposal squad KP',
  'Motorway Police Helpline',
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  language,
  currentCoords,
  detectedLocationName,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text:
        language === 'ur'
          ? 'السلام علیکم! میں پنیزئی ایمرجنسی نیٹ ورک کا مصدقہ اے آئی اسسٹنٹ ہوں۔ میں صرف پاکستان کے تصدیق شدہ سرکاری ڈیٹا بیس سے ہی نمبر فراہم کرتا ہوں۔ آپ کو کس شہر یا شعبے کے لیے ہنگامی مدد درکار ہے؟'
          : language === 'ps'
          ? 'سلام! زه د پنیزئي بیړنۍ شبکې تایید شوی AI مرستیال یم. زه یوازې له باوري او رسمي سرچینو څخه معلومات وړاندې کوم. تاسو ته په کوم ښار یا څانګه کې بیړنۍ مرسته پکار ده؟'
          : 'Welcome to Panezai Emergency Network AI. I am strictly grounded in verified Pakistan emergency agency registries and will NEVER invent phone numbers. How may I assist you right now?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputValue.trim();
    if (!textToSend || isLoading) return;

    const userMsg: Message = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          language,
          userLocation: {
            coords: currentCoords,
            area: detectedLocationName,
          },
        }),
      });

      const data = await res.json();
      const botReply: Message = {
        id: 'bot-' + Date.now(),
        sender: 'assistant',
        text: data.reply || t.noNumbersFound,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      const errorReply: Message = {
        id: 'bot-err-' + Date.now(),
        sender: 'assistant',
        text:
          'Universal emergency numbers across Pakistan: Rescue 1122 (Ambulance & Fire), 15 (Police), 115 (Edhi), 130 (Motorway Police). Please dial directly from your phone.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#091122] border border-slate-700 rounded-2xl shadow-2xl p-4 sm:p-6 text-white my-auto flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Panezai Verified Emergency Assistant</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/90 border border-emerald-800/80 px-2 py-0.5 rounded">
                  Strictly Grounded
                </span>
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero hallucination policy: Only verified official Pakistan numbers</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick prompt chips */}
        <div className="py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-thin text-xs border-b border-slate-800/60">
          <span className="text-slate-400 text-[11px] flex-shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Try:
          </span>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white whitespace-nowrap flex-shrink-0 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-950/60 font-medium'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-slate-900/90 rounded-2xl w-fit border border-slate-800 text-xs text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Querying verified Pakistan emergency database...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="pt-3 border-t border-slate-800 flex gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask emergency assistant (e.g. Ambulance in Quetta)..."
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center justify-center cursor-pointer transition-colors shadow-md shadow-emerald-950/60"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
