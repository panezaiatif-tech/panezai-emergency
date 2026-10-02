import React, { useState } from 'react';
import {
  Share2,
  PhoneCall,
  MessageCircle,
  AlertTriangle,
  Plus,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  Droplet,
  Car,
  Flame,
  CheckCircle,
} from 'lucide-react';
import { CommunityAlert, SupportedLanguage } from '../types/emergency.ts';
import { storageService } from '../services/storageService.ts';

interface CommunityAlertsProps {
  language: SupportedLanguage;
  onNativeCall: (phone: string, name?: string) => void;
  onOpenWhatsApp: (phone: string, initialMessage?: string) => void;
}

export const CommunityAlerts: React.FC<CommunityAlertsProps> = ({
  language,
  onNativeCall,
  onOpenWhatsApp,
}) => {
  const [alerts, setAlerts] = useState<CommunityAlert[]>(() => storageService.getCommunityAlerts());
  const [isPosting, setIsPosting] = useState(false);

  // Form State
  const [authorName, setAuthorName] = useState('');
  const [authorPhone, setAuthorPhone] = useState('');
  const [category, setCategory] = useState<CommunityAlert['category']>('Blood Need');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<CommunityAlert['urgency']>('HIGH');
  const [postedSuccess, setPostedSuccess] = useState(false);

  const handlePostAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !authorPhone.trim() || !location.trim() || !description.trim()) {
      alert('Please fill out all fields.');
      return;
    }

    const newAlert: CommunityAlert = {
      id: 'alt-' + Date.now(),
      authorName: authorName.trim(),
      authorPhone: authorPhone.trim(),
      category,
      location: location.trim(),
      description: description.trim(),
      urgency,
      timestamp: new Date().toISOString(),
      sharesCount: 1,
      verified: true,
    };

    storageService.addCommunityAlert(newAlert);
    setAlerts(storageService.getCommunityAlerts());
    setPostedSuccess(true);
    setTimeout(() => {
      setPostedSuccess(false);
      setIsPosting(false);
      setAuthorName('');
      setAuthorPhone('');
      setLocation('');
      setDescription('');
    }, 1800);
  };

  const handleShareToWhatsApp = (alert: CommunityAlert) => {
    storageService.incrementAlertShare(alert.id);
    setAlerts(storageService.getCommunityAlerts());

    const text = `🚨 *PANEZAI COMMUNITY ALERT* 🚨\n*Category:* ${alert.category} (${alert.urgency})\n*Location:* ${alert.location}\n*Details:* ${alert.description}\n*Contact Person:* ${alert.authorName} (${alert.authorPhone})\n\n_Shared via Panezai Emergency Network. Please help if in area!_`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-[#0C1A30] via-[#0B1528] to-[#0A1D24] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Community Emergency Broadcast Hub</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white">
            Share Emergency Alerts to the Community Through Your Number
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Post urgent blood requirements, road hazards, accident witness requests, or disaster alerts so verified neighbors can respond.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsPosting(!isPosting)}
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 cursor-pointer transition-all flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isPosting ? 'Close Form' : 'Broadcast New Alert'}</span>
        </button>
      </div>

      {/* Post Alert Form */}
      {isPosting && (
        <div className="bg-[#0C152B] border-2 border-red-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl animate-in fade-in duration-200">
          {postedSuccess ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-lg font-bold text-white">Alert Broadcasted Successfully!</h4>
              <p className="text-xs text-slate-300">
                Your emergency request is now visible to the community and can be shared to WhatsApp groups.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePostAlert} className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>📢</span> Post an Emergency Community Alert
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Asad Ullah Panezai"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Your Phone Number (For community to contact) *</label>
                  <input
                    type="tel"
                    required
                    value={authorPhone}
                    onChange={(e) => setAuthorPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Alert Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Blood Need">🩸 Blood Urgent Need</option>
                    <option value="Accident Alert">🚗 Accident Alert</option>
                    <option value="Road Block">🚧 Road Block / Landslide</option>
                    <option value="Flood / Disaster">🌊 Flood / Natural Disaster</option>
                    <option value="Medical Help">🏥 Medical / Hospital Emergency</option>
                    <option value="General">📢 General Safety Warning</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Exact Location / Hospital / Highway *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bolan Medical Complex, Quetta / M-2 Salt Range"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Urgency Level</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="CRITICAL">🔴 CRITICAL (Immediate Life Threat)</option>
                    <option value="HIGH">🟠 HIGH (Urgent Response Needed)</option>
                    <option value="NORMAL">🟡 NORMAL (Informational)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold text-xs">
                  Emergency Description & Details *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Clearly describe the emergency, blood group, patient condition, or road block details..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPosting(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/60"
                >
                  Broadcast Alert Now
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Alerts Feed */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 sm:p-5 rounded-3xl border shadow-xl transition-all ${
              alert.urgency === 'CRITICAL'
                ? 'bg-gradient-to-r from-red-950/40 via-[#0C152B] to-red-950/20 border-red-500/60'
                : 'bg-[#0C152B] border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded shadow ${
                    alert.urgency === 'CRITICAL'
                      ? 'bg-red-600 text-white'
                      : alert.urgency === 'HIGH'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {alert.urgency}
                </span>

                <span className="text-xs font-bold text-white bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-lg">
                  {alert.category}
                </span>

                {alert.verified && (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Community Verified</span>
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                {new Date(alert.timestamp).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-100 leading-relaxed mb-3">
              {alert.description}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="font-bold text-white">{alert.location}</span>
                <span className="text-slate-500">·</span>
                <span>By {alert.authorName}</span>
              </div>

              {/* Action Buttons: 1-Tap Call, WhatsApp, Share */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNativeCall(alert.authorPhone, alert.authorName)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                  title="Call contact directly via cellular SIM"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call {alert.authorPhone}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onOpenWhatsApp(
                      alert.authorPhone,
                      `Hello ${alert.authorName}, I am contacting you regarding your emergency alert on Panezai Network: "${alert.description.substring(0, 50)}..."`
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                  title="Chat with author on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareToWhatsApp(alert)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  title="Share to WhatsApp Groups"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
