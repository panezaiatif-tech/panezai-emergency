import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Send,
  PhoneCall,
  MapPin,
  CheckCheck,
  Sparkles,
  Paperclip,
  Share2,
  ExternalLink,
  Bot,
  Users,
  Search,
  Plus,
} from 'lucide-react';
import { ChatConversation, ChatMessage, Coordinates, SupportedLanguage } from '../types/emergency.ts';
import { storageService } from '../services/storageService.ts';

interface WhatsAppChatProps {
  language: SupportedLanguage;
  currentCoords: Coordinates | null;
  detectedLocationName?: string;
  onNativeCall: (phone: string, name?: string) => void;
}

const DEFAULT_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'conv-emergency',
    name: 'Rescue 1122 & Police Dispatch Desk',
    phone: '1122',
    category: 'emergency',
    lastMessage: 'Ready for emergency intake. How can we assist you?',
    lastMessageTime: 'Just now',
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 'conv-family',
    name: 'Family Emergency Circle',
    phone: '0300-1234567',
    category: 'family',
    lastMessage: 'Location received. Everyone stay safe.',
    lastMessageTime: '10:14 AM',
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 'conv-community',
    name: 'Panezai Community Volunteers',
    phone: '0333-7894561',
    category: 'community',
    lastMessage: 'Blood donation camp scheduled at Civil Hospital Quetta.',
    lastMessageTime: 'Yesterday',
    unreadCount: 1,
    isOnline: false,
  },
];

const QUICK_PRESETS = [
  '🚨 URGENT: I need immediate help at my current location!',
  '🚑 Please dispatch an ambulance immediately.',
  '📍 Sending my verified GPS location coordinates.',
  '🩸 Inquiring about emergency blood donors.',
  '✅ All clear now, thank you for your prompt response.',
];

export const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  language,
  currentCoords,
  detectedLocationName,
  onNativeCall,
}) => {
  const [conversations, setConversations] = useState<ChatConversation[]>(DEFAULT_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>('conv-emergency');
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    storageService.getChatMessages('conv-emergency')
  );
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Quick Direct WhatsApp Launcher inputs
  const [quickWaPhone, setQuickWaPhone] = useState('');
  const [quickWaText, setQuickWaText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Switch conversation
  const selectConversation = (id: string) => {
    setActiveConvId(id);
    const msgs = storageService.getChatMessages(id);
    setMessages(msgs);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  // Send message in-app + auto-respond if talking to emergency dispatcher
  const handleSendMessage = async (textToSend?: string, isLoc = false) => {
    const text = textToSend || inputVal.trim();
    if (!text) return;

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'me',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      isLocation: isLoc,
      locationCoords: isLoc && currentCoords ? currentCoords : undefined,
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    storageService.saveChatMessages(activeConvId, updated);
    if (!textToSend) setInputVal('');

    // If talking to Emergency Dispatcher AI, trigger backend response
    if (activeConvId === 'conv-emergency') {
      setIsTyping(true);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updated,
            language,
          }),
        });
        const data = await res.json();
        const replyMsg: ChatMessage = {
          id: 'rep-' + Date.now(),
          sender: 'other',
          text: data.reply || 'Emergency acknowledged. Keep lines open for dispatch.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read',
        };
        const withReply = [...updated, replyMsg];
        setMessages(withReply);
        storageService.saveChatMessages(activeConvId, withReply);
      } catch (err) {
        console.warn('Chat error:', err);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleShareLocationPin = () => {
    if (!currentCoords) {
      alert('GPS location is currently unavailable. Please enable GPS.');
      return;
    }
    const locText = `📍 Current Emergency GPS Location: https://maps.google.com/?q=${currentCoords.lat},${currentCoords.lng} (${detectedLocationName || 'Pakistan'})`;
    handleSendMessage(locText, true);
  };

  // Launch official WhatsApp app with target phone & text
  const openExternalWhatsApp = (phone: string, text = '') => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '92' + cleaned.substring(1);
    } else if (!cleaned.startsWith('92') && cleaned.length === 10) {
      cleaned = '92' + cleaned;
    }
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* 1. Direct WhatsApp Launcher Widget ("place of watsapp number and chats") */}
      <div className="bg-gradient-to-r from-[#0C1E1B] via-[#0B1528] to-[#0A1A1E] border border-emerald-800/60 rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#25D366] uppercase tracking-wider mb-1">
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Direct WhatsApp Launcher (Free & Instant)</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Send WhatsApp Message or Call Any Pakistani Number
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter any family, friend, doctor, or helpline WhatsApp number to chat immediately without saving contact.
            </p>
          </div>

          {/* Form */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <input
              type="tel"
              value={quickWaPhone}
              onChange={(e) => setQuickWaPhone(e.target.value)}
              placeholder="0300-1234567"
              className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#25D366] w-full sm:w-44"
            />
            <input
              type="text"
              value={quickWaText}
              onChange={(e) => setQuickWaText(e.target.value)}
              placeholder="Optional message..."
              className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#25D366] w-full sm:w-56"
            />
            <button
              type="button"
              disabled={!quickWaPhone.trim()}
              onClick={() => openExternalWhatsApp(quickWaPhone, quickWaText)}
              className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/60 cursor-pointer transition-all flex-shrink-0"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Open in WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Full In-App WhatsApp-Style Messenger Hub */}
      <div className="bg-[#0B1429] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[620px]">
        {/* Left Sidebar: Conversations */}
        <div className="w-full md:w-80 border-r border-slate-800 bg-[#091022] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] flex items-center justify-center">
                <MessageCircle className="w-4 h-4 fill-current" />
              </div>
              <h4 className="text-sm font-bold text-white">Emergency Chats</h4>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
              Live Secure
            </span>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {conversations.map((conv) => {
              const isSelected = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-slate-800/80 border-l-4 border-emerald-500' : 'hover:bg-slate-900/60'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-700 flex items-center justify-center font-bold text-white text-sm">
                      {conv.category === 'emergency' ? '🚨' : conv.category === 'family' ? '👨‍👩‍👧' : '🤝'}
                    </div>
                    {conv.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#091022]"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs text-white truncate">{conv.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{conv.lastMessageTime}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{conv.lastMessage}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Chat Thread */}
        <div className="flex-1 flex flex-col bg-[#080E1E] relative">
          {/* Active Chat Header */}
          <div className="p-3.5 px-4 bg-[#0A1224] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-600/40 flex items-center justify-center text-lg">
                {activeConv.category === 'emergency' ? '🚨' : activeConv.category === 'family' ? '👨‍👩‍👧' : '🤝'}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{activeConv.name}</span>
                  {activeConv.isOnline && (
                    <span className="text-[10px] text-emerald-400 font-normal">· online</span>
                  )}
                </h4>
                <div className="text-[11px] font-mono text-slate-400">{activeConv.phone}</div>
              </div>
            </div>

            {/* Quick Actions in Chat Header */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNativeCall(activeConv.phone, activeConv.name)}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow"
                title="Cellular Voice Call (No internet required)"
              >
                <PhoneCall className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => openExternalWhatsApp(activeConv.phone)}
                className="p-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white cursor-pointer shadow"
                title="Launch in WhatsApp"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>

          {/* Quick Presets Bar */}
          <div className="p-2 bg-[#091122]/90 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-thin text-xs">
            <span className="text-slate-400 text-[10px] flex-shrink-0 font-medium pl-1">
              ⚡ Quick:
            </span>
            {QUICK_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(preset)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white whitespace-nowrap text-[11px] flex-shrink-0 cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Message History Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => {
              const isMe = m.sender === 'me';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-md rounded-2xl p-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-md ${
                      isMe
                        ? 'bg-[#005c4b] text-white rounded-br-none'
                        : 'bg-[#202c33] text-slate-100 rounded-bl-none border border-slate-700/60'
                    }`}
                  >
                    {m.isLocation && m.locationCoords && (
                      <div className="mb-2 p-2 bg-black/30 rounded-xl border border-white/10 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-[11px] font-mono">
                          GPS: {m.locationCoords.lat.toFixed(4)}, {m.locationCoords.lng.toFixed(4)}
                        </span>
                      </div>
                    )}
                    <div>{m.text}</div>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-300/80">
                      <span>{m.timestamp}</span>
                      {isMe && <CheckCheck className="w-3.5 h-3.5 text-sky-400" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-[#202c33] border border-slate-700/60 w-fit text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Emergency Desk is typing response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Bar */}
          <div className="p-3 bg-[#0A1224] border-t border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareLocationPin}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
              title="Attach Live GPS Location"
            >
              <MapPin className="w-5 h-5 text-red-400" />
            </button>

            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="Type emergency message or response..."
              className="flex-1 bg-slate-900 border border-slate-700 focus:border-[#25D366] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
            />

            <button
              type="button"
              disabled={!inputVal.trim()}
              onClick={() => handleSendMessage()}
              className="p-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] disabled:opacity-40 text-white cursor-pointer shadow transition-all"
              title="Send Message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
