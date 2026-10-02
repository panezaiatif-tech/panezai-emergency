import React, { useState } from 'react';
import { X, Plus, PhoneCall, Trash2, Shield, Users, MessageSquare } from 'lucide-react';
import { Coordinates, FamilyContact, SupportedLanguage } from '../types/emergency.ts';
import { TRANSLATIONS } from '../data/translations.ts';
import { buildEmergencyLocationMessage } from '../utils/geoUtils.ts';

interface FamilyContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: FamilyContact[];
  onSaveContacts: (contacts: FamilyContact[]) => void;
  language: SupportedLanguage;
  currentCoords: Coordinates | null;
  detectedLocationName?: string;
}

export const FamilyContactsModal: React.FC<FamilyContactsModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onSaveContacts,
  language,
  currentCoords,
  detectedLocationName,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newContact: FamilyContact = {
      id: 'fam-' + Date.now(),
      name: name.trim(),
      relation: relation.trim() || 'Family',
      phone: phone.trim(),
    };

    onSaveContacts([...contacts, newContact]);
    setName('');
    setRelation('');
    setPhone('');
  };

  const handleDelete = (id: string) => {
    onSaveContacts(contacts.filter((c) => c.id !== id));
  };

  const handleSendSOSMessage = (contactPhone: string) => {
    const text = buildEmergencyLocationMessage(currentCoords, detectedLocationName);
    const url = `sms:${contactPhone}?body=${encodeURIComponent(text)}`;
    window.location.href = url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0C152B] border border-slate-700 rounded-2xl shadow-2xl p-5 sm:p-6 text-white my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-800 text-sky-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t.familyContactsTitle}</h3>
            <p className="text-xs text-slate-400">
              Trusted family numbers saved securely on your device for rapid SOS dispatch
            </p>
          </div>
        </div>

        {/* Existing Contacts List */}
        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-1">
          {contacts.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
              No family contacts added yet. Add close relatives below for 1-tap SOS alerts.
            </div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800"
              >
                <div>
                  <div className="font-bold text-sm text-white">
                    {contact.name} <span className="text-xs text-sky-400 font-normal">({contact.relation})</span>
                  </div>
                  <div className="text-xs font-mono text-slate-300">{contact.phone}</div>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${contact.phone}`}
                    className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                    title="Call Contact"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleSendSOSMessage(contact.phone)}
                    className="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white cursor-pointer"
                    title="Send Emergency SMS"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(contact.id)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete Contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add New Contact Form */}
        <form onSubmit={handleAdd} className="space-y-3 pt-3 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {t.addFamilyContact}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name (e.g. Brother Ahmad)"
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            <input
              type="text"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="Relationship (e.g. Brother, Parent)"
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number (e.g. 0300-1234567)"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
