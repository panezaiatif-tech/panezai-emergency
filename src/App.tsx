/**
 * 🇵🇰 PANEZAI EMERGENCY NETWORK
 * “ONE APP. HELP WHEN YOU NEED IT.”
 * Created by ATIF PANEZAI
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  PhoneCall,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Bot,
  Compass,
  ListFilter,
  CheckCircle2,
  Users,
  Database,
  ExternalLink,
  ChevronRight,
  HeartHandshake,
  Activity,
  Phone,
  MessageCircle,
  Radio,
  Mic,
  Share2,
  Map as MapIcon,
  BookOpen,
} from 'lucide-react';
import type {
  Coordinates,
  EmergencyCategory,
  EmergencyRecord,
  FamilyContact,
  HistoryLog,
  SupportedLanguage,
  UserReport,
} from './types/emergency.ts';
import { INITIAL_EMERGENCY_RECORDS, PROVINCES } from './data/emergencyDatabase.ts';
import { TRANSLATIONS } from './data/translations.ts';
import { storageService } from './services/storageService.ts';
import { calculateHaversineDistance, findClosestPakistanCity } from './utils/geoUtils.ts';

// Components
import { Header } from './components/Header.tsx';
import { SOSModal } from './components/SOSModal.tsx';
import { LocationSelector } from './components/LocationSelector.tsx';
import { EmergencySearchBar } from './components/EmergencySearchBar.tsx';
import { EmergencyCard } from './components/EmergencyCard.tsx';
import { NearestServices } from './components/NearestServices.tsx';
import { EmergencyMap } from './components/EmergencyMap.tsx';
import { SafetyDisclaimer } from './components/SafetyDisclaimer.tsx';
import { FamilyContactsModal } from './components/FamilyContactsModal.tsx';
import { ReportIssueModal } from './components/ReportIssueModal.tsx';
import { AdminModal } from './components/AdminModal.tsx';
import { VoiceAssistantModal } from './components/VoiceAssistantModal.tsx';
import { EmergencyGuidanceModal } from './components/EmergencyGuidanceModal.tsx';
import { PhoneDialer } from './components/PhoneDialer.tsx';
import { WhatsAppChat } from './components/WhatsAppChat.tsx';
import { CommunityAlerts } from './components/CommunityAlerts.tsx';
import { PanezaiLogo } from './components/PanezaiLogo.tsx';

type MainAppModule = 'emergency' | 'map' | 'dialer' | 'whatsapp' | 'community';

export default function App() {
  // App Language
  const [language, setLanguage] = useState<SupportedLanguage>(() => storageService.getLanguage());

  // Database Records
  const [records, setRecords] = useState<EmergencyRecord[]>(() => storageService.getRecords());
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => storageService.getLastSyncTimestamp());

  // Family Contacts
  const [familyContacts, setFamilyContacts] = useState<FamilyContact[]>(() =>
    storageService.getFamilyContacts()
  );

  // User Reports & Audit Logs
  const [reports, setReports] = useState<UserReport[]>(() => storageService.getReports());
  const [auditLogs, setAuditLogs] = useState<HistoryLog[]>(() => storageService.getAuditLogs());

  // Location State
  const [currentCoords, setCurrentCoords] = useState<Coordinates | null>(null);
  const [detectedLocationName, setDetectedLocationName] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('All Pakistan / National');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Active Main App Module
  const [activeModule, setActiveModule] = useState<MainAppModule>('emergency');
  const [emergencySubTab, setEmergencySubTab] = useState<'directory' | 'nearest'>('directory');

  // Modals
  const [isSosOpen, setIsSosOpen] = useState<boolean>(false);
  const [isFamilyOpen, setIsFamilyOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState<boolean>(false);
  const [isGuidanceOpen, setIsGuidanceOpen] = useState<boolean>(false);
  const [reportTargetRecord, setReportTargetRecord] = useState<EmergencyRecord | null>(null);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const isRtl = language === 'ur' || language === 'ps';

  // Handle Language Change
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    storageService.setLanguage(newLang);
  };

  // Attempt silent GPS detection on initial mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: Coordinates = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setCurrentCoords(coords);
          const closest = findClosestPakistanCity(coords);
          setDetectedLocationName(`${closest.city}, ${closest.district}`);
          setSelectedProvince(closest.province);
          setSelectedDistrict(closest.district);
        },
        (err) => {
          console.log('GPS initial prompt skipped or silent failure', err);
        },
        { timeout: 8000 }
      );
    }
  }, []);

  const handleLocationDetected = (
    coords: Coordinates,
    cityData: { city: string; district: string; province: string }
  ) => {
    setCurrentCoords(coords);
    setDetectedLocationName(`${cityData.city}, ${cityData.district}`);
    setSelectedProvince(cityData.province);
    setSelectedDistrict(cityData.district);
  };

  // Database Save Handlers
  const handleSaveRecords = (updated: EmergencyRecord[]) => {
    setRecords(updated);
    storageService.saveRecords(updated);
    setLastSyncTime(storageService.getLastSyncTimestamp());
  };

  const handleResetDb = () => {
    const initial = storageService.resetToDefault();
    setRecords(initial);
    setLastSyncTime(storageService.getLastSyncTimestamp());
  };

  const handleSaveFamilyContacts = (contacts: FamilyContact[]) => {
    setFamilyContacts(contacts);
    storageService.saveFamilyContacts(contacts);
  };

  const handleSubmitReport = (newReport: UserReport) => {
    storageService.addReport(newReport);
    setReports(storageService.getReports());
  };

  const handleResolveReport = (reportId: string) => {
    storageService.resolveReport(reportId);
    setReports(storageService.getReports());
  };

  const handleAddAuditLog = (log: HistoryLog) => {
    storageService.addAuditLog(log);
    setAuditLogs(storageService.getAuditLogs());
  };

  // Universal Cellular Direct Call Function (No internet required!)
  const handleNativeCall = (phoneToCall: string, name?: string) => {
    const cleaned = phoneToCall.replace(/[-\s]/g, '');
    storageService.addCallLog({
      id: 'call-' + Date.now(),
      name: name || phoneToCall,
      phone: phoneToCall,
      type: 'outgoing',
      timestamp: new Date().toISOString(),
    });
    window.location.href = `tel:${cleaned}`;
  };

  // Universal WhatsApp Launcher
  const handleOpenWhatsApp = (phoneNumber: string, initialMessage = '') => {
    let cleaned = phoneNumber.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '92' + cleaned.substring(1);
    } else if (!cleaned.startsWith('92') && cleaned.length === 10) {
      cleaned = '92' + cleaned;
    }
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(initialMessage)}`;
    window.open(url, '_blank');
  };

  // Filtered Records Calculation
  const filteredRecords = useMemo(() => {
    return records
      .map((r) => {
        if (currentCoords && r.coordinates) {
          const dist = calculateHaversineDistance(currentCoords, r.coordinates);
          return { ...r, distanceKm: dist };
        }
        return r;
      })
      .filter((r) => {
        if (selectedCategory !== 'all' && r.category !== selectedCategory) {
          return false;
        }

        if (selectedProvince !== 'All Pakistan / National') {
          if (r.province !== selectedProvince && r.province !== 'All Pakistan / National') {
            return false;
          }
        }

        if (selectedDistrict !== 'all') {
          if (
            r.district !== selectedDistrict &&
            r.province !== 'All Pakistan / National' &&
            r.district !== 'National HQ / Inter-Provincial'
          ) {
            return false;
          }
        }

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchOrg = r.organization.toLowerCase().includes(query);
          const matchPhone = r.phone.replace(/[-\s]/g, '').includes(query.replace(/[-\s]/g, ''));
          const matchAlt = r.altPhone?.replace(/[-\s]/g, '').includes(query.replace(/[-\s]/g, ''));
          const matchCity = r.city.toLowerCase().includes(query);
          const matchDistrict = r.district.toLowerCase().includes(query);
          const matchProvince = r.province.toLowerCase().includes(query);
          const matchCategory = r.category.toLowerCase().includes(query);
          const matchArea = r.area?.toLowerCase().includes(query);

          const tokens = query.split(' ').filter(Boolean);
          const allTokensMatch = tokens.every(
            (token) =>
              r.organization.toLowerCase().includes(token) ||
              r.city.toLowerCase().includes(token) ||
              r.district.toLowerCase().includes(token) ||
              r.category.toLowerCase().includes(token) ||
              r.province.toLowerCase().includes(token)
          );

          if (
            !matchOrg &&
            !matchPhone &&
            !matchAlt &&
            !matchCity &&
            !matchDistrict &&
            !matchProvince &&
            !matchCategory &&
            !matchArea &&
            !allTokensMatch
          ) {
            return false;
          }
        }

        return true;
      });
  }, [records, currentCoords, selectedCategory, selectedProvince, selectedDistrict, searchQuery]);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#070E1E] text-slate-100 flex flex-col font-sans transition-colors"
    >
      {/* Sticky Header with Vector Logo & Controls */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        onOpenSos={() => setIsSosOpen(true)}
        onOpenFamily={() => setIsFamilyOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenVoiceListener={() => setIsVoiceAssistantOpen(true)}
        lastSyncTime={lastSyncTime}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ========================================================
            HERO SECTION WITH 🆘 SOS & TALK TO EMERGENCY AI
           ======================================================== */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A0A12] via-[#0F172A] to-[#0A1629] border-2 border-red-600/70 p-5 sm:p-8 shadow-2xl shadow-red-950/50">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-red-400 bg-red-950/80 border border-red-800/80 px-3 py-1 rounded-full mb-3 shadow">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>National Emergency & AI Voice Assistance Companion</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                🇵🇰 PANEZAI EMERGENCY NETWORK
              </h2>
              <p className="text-base sm:text-lg text-slate-300 font-medium mt-1">
                “ONE APP. HELP WHEN YOU NEED IT.”
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Live AI Voice Assistant · 22-Category Verified Database · Interactive Vector Map · 1-Tap Calling · First-Aid Guidance.
              </p>

              {/* Major Action Buttons in Hero */}
              <div className="flex flex-wrap items-center gap-2.5 mt-5">
                {/* 🎙️ TALK TO EMERGENCY AI (Core Feature) */}
                <button
                  type="button"
                  onClick={() => setIsVoiceAssistantOpen(true)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base inline-flex items-center gap-2.5 shadow-xl shadow-emerald-950/80 border border-emerald-400/60 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Mic className="w-5 h-5 animate-bounce text-emerald-200" />
                  <span>🎙️ TALK TO EMERGENCY AI</span>
                </button>

                {/* 🗺️ EMERGENCY MAP */}
                <button
                  type="button"
                  onClick={() => setActiveModule('map')}
                  className="px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                >
                  <MapIcon className="w-4 h-4 text-emerald-400" />
                  <span>Interactive Map</span>
                </button>

                {/* 📖 EMERGENCY GUIDANCE */}
                <button
                  type="button"
                  onClick={() => setIsGuidanceOpen(true)}
                  className="px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>First-Aid Guidance</span>
                </button>
              </div>
            </div>

            {/* Huge 🆘 SOS Button */}
            <div className="flex flex-col items-center justify-center flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsSosOpen(true)}
                className="relative group w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-800 hover:from-red-400 hover:to-red-700 text-white font-black text-3xl sm:text-4xl shadow-2xl shadow-red-900 border-4 border-red-300/80 flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Trigger Emergency SOS"
              >
                <span className="animate-ping absolute inset-0 rounded-full bg-red-500 opacity-30"></span>
                <span className="text-4xl sm:text-5xl drop-shadow-md">🆘</span>
                <span className="tracking-wider drop-shadow-md">{t.sosButton}</span>
                <span className="text-[11px] font-semibold text-red-100 uppercase tracking-widest">
                  TAP FOR HELP
                </span>
              </button>
            </div>
          </div>

          {/* ========================================================
              LARGE EASY-TO-PRESS EMERGENCY CATEGORY BUTTONS
             ======================================================== */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-2.5 mt-6 pt-6 border-t border-slate-800/80">
            {/* 🚑 Ambulance */}
            <button
              type="button"
              onClick={() => handleNativeCall('1122', 'Rescue 1122 Ambulance')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-red-950/70 hover:bg-red-900 border border-red-700/80 text-white transition-all cursor-pointer shadow"
            >
              <span className="text-2xl mb-1">🚑</span>
              <span className="font-extrabold text-xs">Ambulance</span>
              <span className="font-mono text-[11px] text-red-300 font-bold">1122</span>
            </button>

            {/* 👮 Police */}
            <button
              type="button"
              onClick={() => handleNativeCall('15', 'Madadgar Police 15')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-950/70 hover:bg-blue-900 border border-blue-700/80 text-white transition-all cursor-pointer shadow"
            >
              <span className="text-2xl mb-1">👮</span>
              <span className="font-extrabold text-xs">Police</span>
              <span className="font-mono text-[11px] text-blue-300 font-bold">15</span>
            </button>

            {/* 🚒 Fire */}
            <button
              type="button"
              onClick={() => handleNativeCall('16', 'Fire Brigade 16')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-950/70 hover:bg-amber-900 border border-amber-700/80 text-white transition-all cursor-pointer shadow"
            >
              <span className="text-2xl mb-1">🚒</span>
              <span className="font-extrabold text-xs">Fire</span>
              <span className="font-mono text-[11px] text-amber-300 font-bold">16</span>
            </button>

            {/* 🏥 Hospital */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Hospital Emergency');
                setActiveModule('emergency');
                setEmergencySubTab('directory');
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-950/70 hover:bg-rose-900 border border-rose-700/80 text-white transition-all cursor-pointer shadow"
            >
              <span className="text-2xl mb-1">🏥</span>
              <span className="font-extrabold text-xs">Hospital</span>
              <span className="text-[11px] text-rose-300 font-semibold">Trauma Casualty</span>
            </button>

            {/* 🩸 Blood */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Blood Bank');
                setActiveModule('emergency');
                setEmergencySubTab('directory');
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-950/70 hover:bg-rose-900 border border-rose-700/80 text-white transition-all cursor-pointer shadow"
            >
              <span className="text-2xl mb-1">🩸</span>
              <span className="font-extrabold text-xs">Blood Bank</span>
              <span className="text-[11px] text-rose-300 font-semibold">24/7 Supply</span>
            </button>

            {/* 🛠️ Mechanic */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Mechanic');
                setActiveModule('emergency');
                setEmergencySubTab('directory');
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white transition-all cursor-pointer shadow"
            >
              <span className="text-2xl mb-1">🛠️</span>
              <span className="font-extrabold text-xs">Mechanic</span>
              <span className="text-[11px] text-slate-400 font-semibold">Breakdown</span>
            </button>

            {/* 🚗 Towing */}
            <button
              type="button"
              onClick={() => handleNativeCall('130', 'Motorway Police NHMP & Towing')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/80 text-white transition-all cursor-pointer shadow col-span-2 sm:col-span-1"
            >
              <span className="text-2xl mb-1">🚗</span>
              <span className="font-extrabold text-xs">Towing / NHMP</span>
              <span className="font-mono text-[11px] text-emerald-300 font-bold">130</span>
            </button>
          </div>
        </section>

        {/* ========================================================
            NAVIGATION TABS
           ======================================================== */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-2.5">
          {/* Tab 1: Emergency Directory */}
          <button
            type="button"
            onClick={() => setActiveModule('emergency')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-lg ${
              activeModule === 'emergency'
                ? 'bg-gradient-to-r from-red-950/80 to-slate-900 border-red-500 text-white ring-2 ring-red-500/30'
                : 'bg-[#0B1429] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">🚨</span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-black/40 px-1.5 py-0.5 rounded">
                {records.length}
              </span>
            </div>
            <div className="font-extrabold text-xs sm:text-sm text-white">Emergency Directory</div>
            <div className="text-[10px] text-slate-400">22 verified categories</div>
          </button>

          {/* Tab 2: Interactive Vector Map */}
          <button
            type="button"
            onClick={() => setActiveModule('map')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-lg ${
              activeModule === 'map'
                ? 'bg-gradient-to-r from-emerald-950/80 to-slate-900 border-emerald-500 text-white ring-2 ring-emerald-500/30'
                : 'bg-[#0B1429] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">🗺️</span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-black/40 px-1.5 py-0.5 rounded">
                LIVE
              </span>
            </div>
            <div className="font-extrabold text-xs sm:text-sm text-white">Emergency Map</div>
            <div className="text-[10px] text-slate-400">Highways & facilities</div>
          </button>

          {/* Tab 3: Free Cellular Dialer */}
          <button
            type="button"
            onClick={() => setActiveModule('dialer')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-lg ${
              activeModule === 'dialer'
                ? 'bg-gradient-to-r from-blue-950/80 to-slate-900 border-blue-500 text-white ring-2 ring-blue-500/30'
                : 'bg-[#0B1429] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">📞</span>
              <span className="text-[10px] font-mono font-bold text-blue-400 bg-black/40 px-1.5 py-0.5 rounded">
                OFFLINE
              </span>
            </div>
            <div className="font-extrabold text-xs sm:text-sm text-white">Free Dialer</div>
            <div className="text-[10px] text-slate-400">Offline SIM calls</div>
          </button>

          {/* Tab 4: WhatsApp Chat */}
          <button
            type="button"
            onClick={() => setActiveModule('whatsapp')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-lg ${
              activeModule === 'whatsapp'
                ? 'bg-gradient-to-r from-teal-950/80 to-slate-900 border-[#25D366] text-white ring-2 ring-[#25D366]/30'
                : 'bg-[#0B1429] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">💬</span>
              <span className="text-[10px] font-mono font-bold text-[#25D366] bg-black/40 px-1.5 py-0.5 rounded">
                CHAT
              </span>
            </div>
            <div className="font-extrabold text-xs sm:text-sm text-white">WhatsApp & Chat</div>
            <div className="text-[10px] text-slate-400">Direct message launcher</div>
          </button>

          {/* Tab 5: Community Broadcasts */}
          <button
            type="button"
            onClick={() => setActiveModule('community')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-lg col-span-2 md:col-span-1 ${
              activeModule === 'community'
                ? 'bg-gradient-to-r from-amber-950/80 to-slate-900 border-amber-500 text-white ring-2 ring-amber-500/30'
                : 'bg-[#0B1429] border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">📢</span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-black/40 px-1.5 py-0.5 rounded">
                BROADCAST
              </span>
            </div>
            <div className="font-extrabold text-xs sm:text-sm text-white">Community Alerts</div>
            <div className="text-[10px] text-slate-400">Share via your number</div>
          </button>
        </div>

        {/* ========================================================
            MODULE 1: EMERGENCY DIRECTORY & NEARBY
           ======================================================== */}
        {activeModule === 'emergency' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Location Selector */}
            <LocationSelector
              language={language}
              selectedProvince={selectedProvince}
              selectedDistrict={selectedDistrict}
              onProvinceChange={setSelectedProvince}
              onDistrictChange={setSelectedDistrict}
              currentCoords={currentCoords}
              onLocationDetected={handleLocationDetected}
            />

            {/* Emergency Search Bar */}
            <EmergencySearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              language={language}
            />

            {/* Sub-Tabs: Directory Cards vs Nearest GPS Facilities */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEmergencySubTab('directory')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    emergencySubTab === 'directory'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 border border-emerald-500'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <ListFilter className="w-4 h-4" />
                  <span>{t.directoryTab}</span>
                  <span className="text-xs font-mono bg-black/30 px-1.5 py-0.5 rounded-full">
                    {filteredRecords.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setEmergencySubTab('nearest')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    emergencySubTab === 'nearest'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 border border-emerald-500'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>{t.nearestServicesTab}</span>
                </button>
              </div>

              {/* Talk to AI Voice Assistant Button */}
              <button
                type="button"
                onClick={() => setIsVoiceAssistantOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/60 cursor-pointer transition-all"
              >
                <Mic className="w-4 h-4 animate-pulse text-emerald-200" />
                <span className="hidden sm:inline">Voice Assistant</span>
              </button>
            </div>

            {/* Strict Safety Protocol Guarantee Notice */}
            <SafetyDisclaimer language={language} />

            {/* Directory Cards */}
            {emergencySubTab === 'directory' && (
              <div>
                {filteredRecords.length === 0 ? (
                  <div className="bg-[#0C152B] border border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-8">
                    <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-600/60 text-amber-400 flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                      “I'm unable to find a verified emergency number for this service and location.”
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                      {t.noNumbersFoundDesc}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleNativeCall('1122', 'Rescue 1122')}
                        className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Dial Rescue 1122</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNativeCall('15', 'Police 15')}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Dial Police 15</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                          setSelectedProvince('All Pakistan / National');
                          setSelectedDistrict('all');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRecords.map((record) => (
                      <EmergencyCard
                        key={record.id}
                        record={record}
                        language={language}
                        onReportIssue={(rec) => setReportTargetRecord(rec)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Nearest GPS Facilities View */}
            {emergencySubTab === 'nearest' && (
              <NearestServices
                records={records}
                currentCoords={currentCoords}
                language={language}
                onSelectRecordForReport={(rec) => setReportTargetRecord(rec)}
                onRequestGPS={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        const closest = findClosestPakistanCity(coords);
                        handleLocationDetected(coords, closest);
                      },
                      () => alert('GPS access is required to calculate nearest facility distance.')
                    );
                  }
                }}
              />
            )}
          </div>
        )}

        {/* ========================================================
            MODULE 2: INTERACTIVE LIVE VECTOR MAP
           ======================================================== */}
        {activeModule === 'map' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <EmergencyMap
              records={records}
              currentCoords={currentCoords}
              language={language}
              onCallNumber={handleNativeCall}
            />
          </div>
        )}

        {/* ========================================================
            MODULE 3: FREE DIALER & OFFLINE CALLING
           ======================================================== */}
        {activeModule === 'dialer' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <PhoneDialer
              language={language}
              contacts={familyContacts}
              onSaveContacts={handleSaveFamilyContacts}
              onOpenWhatsApp={handleOpenWhatsApp}
            />
          </div>
        )}

        {/* ========================================================
            MODULE 4: WHATSAPP CHAT & MESSAGES
           ======================================================== */}
        {activeModule === 'whatsapp' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <WhatsAppChat
              language={language}
              currentCoords={currentCoords}
              detectedLocationName={detectedLocationName}
              onNativeCall={handleNativeCall}
            />
          </div>
        )}

        {/* ========================================================
            MODULE 5: COMMUNITY SAFETY BROADCASTS
           ======================================================== */}
        {activeModule === 'community' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <CommunityAlerts
              language={language}
              onNativeCall={handleNativeCall}
              onOpenWhatsApp={handleOpenWhatsApp}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#060C1B] py-10 mt-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <PanezaiLogo size="md" />
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">
                  PANEZAI EMERGENCY NETWORK
                </h4>
                <p className="text-[11px] text-slate-400">
                  National verified emergency dispatch and safety network for Pakistan
                </p>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="font-semibold text-emerald-400 text-xs">
                CREATED BY: ATIF PANEZAI
              </p>
              <p className="text-[11px] text-slate-400">
                “ONE APP. HELP WHEN YOU NEED IT.”
              </p>
            </div>
          </div>

          {/* Pakistan Emergency Helplines Rapid Summary */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-slate-300">
            <span>🚨 Rescue: <strong className="text-white font-mono">1122</strong></span>
            <span>👮 Police: <strong className="text-white font-mono">15</strong></span>
            <span>🚒 Fire: <strong className="text-white font-mono">16</strong></span>
            <span>🤍 Edhi: <strong className="text-white font-mono">115</strong></span>
            <span>🚗 Motorway: <strong className="text-white font-mono">130</strong></span>
            <span>🚆 Railway: <strong className="text-white font-mono">117</strong></span>
            <span>🔥 Gas: <strong className="text-white font-mono">1199</strong></span>
            <span>⚡ Electricity: <strong className="text-white font-mono">118</strong></span>
            <span>🌊 NDMA: <strong className="text-white font-mono">1129</strong></span>
          </div>

          <p className="text-center text-[10px] text-slate-400">
            LAST DATABASE UPDATE: {new Date(lastSyncTime).toLocaleDateString()} · Official emergency data cached on device for low-internet and offline readiness. Zero guessed numbers guarantee.
          </p>
        </div>
      </footer>

      {/* ========================================================
          MODALS
         ======================================================== */}
      {/* Voice Emergency Assistant Modal (Core Feature) */}
      <VoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        language={language}
        currentCoords={currentCoords}
        detectedLocationName={detectedLocationName}
        onCallNumber={handleNativeCall}
        onTriggerSos={() => {
          setIsVoiceAssistantOpen(false);
          setIsSosOpen(true);
        }}
        onFindHospital={() => {
          setSelectedCategory('Hospital Emergency');
          setActiveModule('emergency');
          setEmergencySubTab('directory');
        }}
        onOpenFamily={() => {
          setIsFamilyOpen(true);
        }}
      />

      {/* Emergency Guidance Manual Modal */}
      <EmergencyGuidanceModal
        isOpen={isGuidanceOpen}
        onClose={() => setIsGuidanceOpen(false)}
        language={language}
        onCallNumber={handleNativeCall}
      />

      {/* SOS Modal */}
      <SOSModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        language={language}
        currentCoords={currentCoords}
        detectedLocationName={detectedLocationName}
        familyContacts={familyContacts}
        onFindBlood={() => {
          setSelectedCategory('Blood Bank');
          setActiveModule('emergency');
          setEmergencySubTab('directory');
        }}
        onFindMechanic={() => {
          setSelectedCategory('Mechanic');
          setActiveModule('emergency');
          setEmergencySubTab('directory');
        }}
        onFindHospital={() => {
          setSelectedCategory('Hospital Emergency');
          setActiveModule('emergency');
          setEmergencySubTab('directory');
        }}
      />

      {/* Family Contacts Modal */}
      <FamilyContactsModal
        isOpen={isFamilyOpen}
        onClose={() => setIsFamilyOpen(false)}
        contacts={familyContacts}
        onSaveContacts={handleSaveFamilyContacts}
        language={language}
        currentCoords={currentCoords}
        detectedLocationName={detectedLocationName}
      />

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={!!reportTargetRecord}
        onClose={() => setReportTargetRecord(null)}
        record={reportTargetRecord}
        onSubmitReport={handleSubmitReport}
        language={language}
      />

      {/* Admin Portal Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        records={records}
        onSaveRecords={handleSaveRecords}
        reports={reports}
        onResolveReport={handleResolveReport}
        auditLogs={auditLogs}
        onAddAuditLog={handleAddAuditLog}
        onResetDb={handleResetDb}
        language={language}
      />
    </div>
  );
}
