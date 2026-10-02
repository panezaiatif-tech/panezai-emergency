import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  MessageCircle,
  Delete,
  UserPlus,
  Clock,
  Users,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { CallLog, FamilyContact, SupportedLanguage } from '../types/emergency.ts';
import { TRANSLATIONS } from '../data/translations.ts';
import { storageService } from '../services/storageService.ts';

interface PhoneDialerProps {
  language: SupportedLanguage;
  contacts: FamilyContact[];
  onSaveContacts: (contacts: FamilyContact[]) => void;
  onOpenWhatsApp: (phoneNumber: string, initialMessage?: string) => void;
}

export const PhoneDialer: React.FC<PhoneDialerProps> = ({
  language,
  contacts,
  onSaveContacts,
  onOpenWhatsApp,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [dialedNumber, setDialedNumber] = useState('');
  const [activeTab, setActiveTab] = useState<'keypad' | 'contacts' | 'recents'>('keypad');
  const [callLogs, setCallLogs] = useState<CallLog[]>(() => storageService.getCallLogs());

  // In-app Call Simulator State ("able to take calls")
  const [simulatedCall, setSimulatedCall] = useState<{
    status: 'ringing' | 'connected' | 'ended';
    callerName: string;
    callerNumber: string;
    isIncoming: boolean;
    durationSeconds: number;
    isMuted: boolean;
    isSpeaker: boolean;
  } | null>(null);

  // New Contact Quick-Add
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // Call duration timer
  useEffect(() => {
    let timer: any;
    if (simulatedCall && simulatedCall.status === 'connected') {
      timer = setInterval(() => {
        setSimulatedCall((prev) =>
          prev ? { ...prev, durationSeconds: prev.durationSeconds + 1 } : null
        );
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [simulatedCall?.status]);

  // Audio tone feedback for dialpad
  const playTone = (freq = 440) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // AudioContext muted/unsupported
    }
  };

  const handleKeyPress = (char: string) => {
    playTone(550 + char.charCodeAt(0) * 10);
    setDialedNumber((prev) => prev + char);
  };

  const handleBackspace = () => {
    playTone(350);
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  // Launch real native cellular calling (NO INTERNET REQUIRED!)
  const handleNativeCall = (numberToCall: string, name?: string) => {
    if (!numberToCall.trim()) return;

    // Log call
    const newLog: CallLog = {
      id: 'call-' + Date.now(),
      name: name || numberToCall,
      phone: numberToCall,
      type: 'outgoing',
      timestamp: new Date().toISOString(),
    };
    storageService.addCallLog(newLog);
    setCallLogs(storageService.getCallLogs());

    // Native SIM voice call protocol
    window.location.href = `tel:${numberToCall.replace(/\s+/g, '')}`;
  };

  // In-app test call simulator
  const startSimulatedCall = (numberToCall: string, callerName: string, isIncoming = false) => {
    setSimulatedCall({
      status: isIncoming ? 'ringing' : 'connected',
      callerName,
      callerNumber: numberToCall,
      isIncoming,
      durationSeconds: 0,
      isMuted: false,
      isSpeaker: true,
    });

    const newLog: CallLog = {
      id: 'call-' + Date.now(),
      name: callerName,
      phone: numberToCall,
      type: isIncoming ? 'incoming' : 'outgoing',
      timestamp: new Date().toISOString(),
    };
    storageService.addCallLog(newLog);
    setCallLogs(storageService.getCallLogs());
  };

  const endSimulatedCall = () => {
    if (simulatedCall) {
      setSimulatedCall((prev) => (prev ? { ...prev, status: 'ended' } : null));
      setTimeout(() => setSimulatedCall(null), 1200);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    const newContact: FamilyContact = {
      id: 'cnt-' + Date.now(),
      name: newContactName.trim(),
      relation: newContactRelation.trim() || 'Friend',
      phone: newContactPhone.trim(),
      isFavorite: true,
    };

    onSaveContacts([...contacts, newContact]);
    setNewContactName('');
    setNewContactRelation('');
    setNewContactPhone('');
    setIsAddingContact(false);
  };

  return (
    <div className="bg-[#0B1429] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
      {/* SIM & Offline Calling Guarantee Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-2xl mb-5 text-xs">
        <div className="flex items-center gap-2 text-emerald-300 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Offline Free Cellular Calling Enabled: Works on all Pakistani SIMs (Jazz, Zong, Telenor, Ufone, SCOM) with 0 Internet Data!</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => startSimulatedCall('1122', 'Rescue 1122 Dispatcher (Simulation)', true)}
            className="px-2.5 py-1 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
            title="Test taking an incoming emergency call"
          >
            <PhoneIncoming className="w-3 h-3" />
            <span>Test Receive Call</span>
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center justify-center gap-2 p-1 bg-slate-900/90 rounded-2xl max-w-md mx-auto mb-6 border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('keypad')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'keypad'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Dialer Pad
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contacts')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'contacts'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Family & Friends ({contacts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('recents')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'recents'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Recent Calls ({callLogs.length})
        </button>
      </div>

      {/* TAB 1: DIALPAD */}
      {activeTab === 'keypad' && (
        <div className="max-w-xs mx-auto space-y-4">
          {/* Dialed Display */}
          <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
            <input
              type="text"
              readOnly
              value={dialedNumber}
              placeholder="Enter number..."
              className="bg-transparent text-center font-mono font-black text-2xl text-white tracking-widest w-full focus:outline-none placeholder-slate-600"
            />
            {dialedNumber && (
              <button
                type="button"
                onClick={handleBackspace}
                className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Backspace"
              >
                <Delete className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { num: '1', sub: '⚡ SOS' },
              { num: '2', sub: 'ABC' },
              { num: '3', sub: 'DEF' },
              { num: '4', sub: 'GHI' },
              { num: '5', sub: 'JKL' },
              { num: '6', sub: 'MNO' },
              { num: '7', sub: 'PQRS' },
              { num: '8', sub: 'TUV' },
              { num: '9', sub: 'WXYZ' },
              { num: '*', sub: 'P' },
              { num: '0', sub: '+' },
              { num: '#', sub: 'W' },
            ].map(({ num, sub }) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="h-16 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border border-slate-800 hover:border-slate-700 text-white flex flex-col items-center justify-center transition-all cursor-pointer shadow-md select-none"
              >
                <span className="text-xl sm:text-2xl font-black font-mono leading-none">{num}</span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                  {sub}
                </span>
              </button>
            ))}
          </div>

          {/* Action Call Buttons: Native SIM Free Call + WhatsApp Call */}
          <div className="flex items-center gap-2 pt-2">
            {/* Native Free SIM Call */}
            <button
              type="button"
              disabled={!dialedNumber}
              onClick={() => handleNativeCall(dialedNumber)}
              className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/80 transition-all cursor-pointer"
            >
              <PhoneCall className="w-5 h-5 animate-pulse" />
              <span>Free SIM Call</span>
            </button>

            {/* Direct WhatsApp Call/Chat */}
            <button
              type="button"
              disabled={!dialedNumber}
              onClick={() => onOpenWhatsApp(dialedNumber)}
              className="h-14 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] disabled:opacity-40 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
              title="Open in WhatsApp"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Quick Emergency Speed Dials */}
          <div className="pt-2 text-center">
            <span className="text-[11px] text-slate-400 block mb-2 font-medium">1-Tap Offline Emergency Speed Dials:</span>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleNativeCall('1122', 'Rescue 1122')}
                className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-bold font-mono"
              >
                🚑 1122
              </button>
              <button
                type="button"
                onClick={() => handleNativeCall('15', 'Police 15')}
                className="px-3 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-300 font-bold font-mono"
              >
                👮 15
              </button>
              <button
                type="button"
                onClick={() => handleNativeCall('16', 'Fire 16')}
                className="px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 font-bold font-mono"
              >
                🚒 16
              </button>
              <button
                type="button"
                onClick={() => handleNativeCall('115', 'Edhi 115')}
                className="px-3 py-1.5 rounded-xl bg-teal-950/80 hover:bg-teal-900 border border-teal-800 text-teal-300 font-bold font-mono"
              >
                🤍 115
              </button>
              <button
                type="button"
                onClick={() => handleNativeCall('130', 'Motorway 130')}
                className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold font-mono"
              >
                🚓 130
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTACTS (Family, Friends, Doctors, Neighbors) */}
      {activeTab === 'contacts' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Personal Contacts for Common Calling</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingContact(true)}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Friend / Family</span>
            </button>
          </div>

          {/* Quick Add Form Modal/Section */}
          {isAddingContact && (
            <form
              onSubmit={handleCreateContact}
              className="bg-slate-900 p-4 rounded-2xl border border-sky-800/60 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Contact Name (e.g. Asad)"
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={newContactRelation}
                  onChange={(e) => setNewContactRelation(e.target.value)}
                  placeholder="Relation (Friend / Doctor)"
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="tel"
                  required
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingContact(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs shadow"
                >
                  Save Contact
                </button>
              </div>
            </form>
          )}

          {/* Contact Cards */}
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">
                      {contact.name}{' '}
                      <span className="text-[11px] text-sky-400 font-normal">
                        ({contact.relation})
                      </span>
                    </div>
                    <div className="font-mono text-slate-400 font-semibold">{contact.phone}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Direct Native Call */}
                  <button
                    type="button"
                    onClick={() => handleNativeCall(contact.phone, contact.name)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                    title="Call directly via SIM"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </button>

                  {/* Direct WhatsApp */}
                  <button
                    type="button"
                    onClick={() => onOpenWhatsApp(contact.phone, `Hello ${contact.name}`)}
                    className="p-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white cursor-pointer"
                    title="WhatsApp Chat"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RECENT CALLS */}
      {activeTab === 'recents' && (
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span>Recent cellular call logs</span>
            <button
              type="button"
              onClick={() => {
                storageService.clearCallLogs();
                setCallLogs([]);
              }}
              className="text-slate-400 hover:text-rose-400"
            >
              Clear Logs
            </button>
          </div>

          <div className="space-y-2">
            {callLogs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  {log.type === 'incoming' && (
                    <PhoneIncoming className="w-4 h-4 text-emerald-400" />
                  )}
                  {log.type === 'outgoing' && (
                    <PhoneOutgoing className="w-4 h-4 text-sky-400" />
                  )}
                  {log.type === 'missed' && (
                    <PhoneMissed className="w-4 h-4 text-rose-400" />
                  )}

                  <div>
                    <div className="font-bold text-white">{log.name}</div>
                    <div className="font-mono text-slate-400 text-[11px]">{log.phone}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleNativeCall(log.phone, log.name)}
                    className="p-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white cursor-pointer"
                    title="Redial"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IN-APP SIMULATED ACTIVE / INCOMING CALL SCREEN */}
      {simulatedCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-gradient-to-b from-[#111C38] to-[#070D1C] border border-slate-700 rounded-3xl p-6 text-center text-white shadow-2xl flex flex-col items-center justify-between min-h-[460px]">
            {/* Top State */}
            <div>
              <div className="w-20 h-20 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4 text-3xl shadow-xl shadow-emerald-950/80 animate-pulse">
                {simulatedCall.isIncoming ? '📲' : '📞'}
              </div>
              <h3 className="text-xl font-black text-white">{simulatedCall.callerName}</h3>
              <p className="text-xs font-mono text-emerald-400 font-bold mt-1">
                {simulatedCall.callerNumber}
              </p>
              <div className="text-xs text-slate-400 mt-2 font-mono">
                {simulatedCall.status === 'ringing'
                  ? 'Incoming Emergency Call...'
                  : simulatedCall.status === 'ended'
                  ? 'Call Finished'
                  : formatSeconds(simulatedCall.durationSeconds)}
              </div>
            </div>

            {/* Mid controls if connected */}
            {simulatedCall.status === 'connected' && (
              <div className="grid grid-cols-2 gap-4 w-full px-6 my-6">
                <button
                  type="button"
                  onClick={() =>
                    setSimulatedCall((prev) =>
                      prev ? { ...prev, isMuted: !prev.isMuted } : null
                    )
                  }
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1 text-xs font-semibold ${
                    simulatedCall.isMuted
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {simulatedCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  <span>{simulatedCall.isMuted ? 'Muted' : 'Mute'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSimulatedCall((prev) =>
                      prev ? { ...prev, isSpeaker: !prev.isSpeaker } : null
                    )
                  }
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1 text-xs font-semibold ${
                    simulatedCall.isSpeaker
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {simulatedCall.isSpeaker ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <VolumeX className="w-5 h-5" />
                  )}
                  <span>{simulatedCall.isSpeaker ? 'Speaker On' : 'Speaker Off'}</span>
                </button>
              </div>
            )}

            {/* Bottom Actions */}
            {simulatedCall.status === 'ringing' ? (
              <div className="flex items-center justify-around w-full mt-6">
                {/* Decline */}
                <button
                  type="button"
                  onClick={endSimulatedCall}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-950 cursor-pointer"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
                {/* Accept */}
                <button
                  type="button"
                  onClick={() =>
                    setSimulatedCall((prev) =>
                      prev ? { ...prev, status: 'connected' } : null
                    )
                  }
                  className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-950 animate-bounce cursor-pointer"
                >
                  <PhoneCall className="w-7 h-7" />
                </button>
              </div>
            ) : (
              <div className="w-full mt-4">
                <button
                  type="button"
                  onClick={endSimulatedCall}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-950 mx-auto cursor-pointer"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
