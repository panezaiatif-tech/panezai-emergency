import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Download,
  Upload,
  History,
  Flag,
  Lock,
} from 'lucide-react';
import {
  EmergencyCategory,
  EmergencyRecord,
  HistoryLog,
  SupportedLanguage,
  UserReport,
  VerificationStatus,
} from '../types/emergency.ts';
import { CATEGORIES, PROVINCES } from '../data/emergencyDatabase.ts';
import { TRANSLATIONS } from '../data/translations.ts';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: EmergencyRecord[];
  onSaveRecords: (records: EmergencyRecord[]) => void;
  reports: UserReport[];
  onResolveReport: (id: string) => void;
  auditLogs: HistoryLog[];
  onAddAuditLog: (log: HistoryLog) => void;
  onResetDb: () => void;
  language: SupportedLanguage;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  records,
  onSaveRecords,
  reports,
  onResolveReport,
  auditLogs,
  onAddAuditLog,
  onResetDb,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Tabs inside admin panel
  const [activeTab, setActiveTab] = useState<'records' | 'add' | 'reports' | 'history'>('records');

  // Add/Edit Record Form State
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [country] = useState<'Pakistan'>('Pakistan');
  const [province, setProvince] = useState(PROVINCES[1]);
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [category, setCategory] = useState<EmergencyCategory>('Ambulance');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [is24_7, setIs24_7] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('VERIFIED');
  const [officialSource, setOfficialSource] = useState('');
  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  // Admin filter search
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1122' || pinInput === '7860') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleStartEdit = (record: EmergencyRecord) => {
    setEditingRecordId(record.id);
    setProvince(record.province as any);
    setDivision(record.division || '');
    setDistrict(record.district);
    setTehsil(record.tehsil || '');
    setCity(record.city);
    setArea(record.area || '');
    setCategory(record.category);
    setOrganization(record.organization);
    setPhone(record.phone);
    setAltPhone(record.altPhone || '');
    setIs24_7(record.is24_7);
    setVerificationStatus(record.verificationStatus);
    setOfficialSource(record.officialSource);
    setNotes(record.notes || '');
    setAddress(record.address || '');
    setLat(record.coordinates ? record.coordinates.lat.toString() : '');
    setLng(record.coordinates ? record.coordinates.lng.toString() : '');
    setActiveTab('add');
  };

  const handleResetForm = () => {
    setEditingRecordId(null);
    setDivision('');
    setDistrict('');
    setTehsil('');
    setCity('');
    setArea('');
    setOrganization('');
    setPhone('');
    setAltPhone('');
    setOfficialSource('');
    setNotes('');
    setAddress('');
    setLat('');
    setLng('');
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization.trim() || !phone.trim() || !district.trim() || !city.trim()) {
      alert('Please fill in required fields: Organization, Phone, District, and City.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const coords = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;

    if (editingRecordId) {
      // Update existing record
      const updated = records.map((r) =>
        r.id === editingRecordId
          ? {
              ...r,
              country,
              province,
              division: division.trim() || undefined,
              district: district.trim(),
              tehsil: tehsil.trim() || undefined,
              city: city.trim(),
              area: area.trim() || undefined,
              category,
              organization: organization.trim(),
              phone: phone.trim(),
              altPhone: altPhone.trim() || undefined,
              is24_7,
              verificationStatus,
              officialSource: officialSource.trim() || 'Verified Official Source',
              lastUpdated: todayStr,
              notes: notes.trim() || undefined,
              address: address.trim() || undefined,
              coordinates: coords,
            }
          : r
      );
      onSaveRecords(updated);
      onAddAuditLog({
        id: 'log-' + Date.now(),
        action: 'UPDATE',
        recordId: editingRecordId,
        organizationName: organization,
        details: `Updated emergency number for ${city}, ${district}`,
        timestamp: new Date().toISOString(),
        adminName: 'Authorized Admin',
      });
    } else {
      // Create new record
      const newRec: EmergencyRecord = {
        id: 'rec-' + Date.now(),
        country,
        province,
        division: division.trim() || undefined,
        district: district.trim(),
        tehsil: tehsil.trim() || undefined,
        city: city.trim(),
        area: area.trim() || undefined,
        category,
        organization: organization.trim(),
        phone: phone.trim(),
        altPhone: altPhone.trim() || undefined,
        is24_7,
        verificationStatus,
        officialSource: officialSource.trim() || 'Verified Official Agency',
        verificationDate: todayStr,
        lastUpdated: todayStr,
        notes: notes.trim() || undefined,
        address: address.trim() || undefined,
        coordinates: coords,
      };
      onSaveRecords([newRec, ...records]);
      onAddAuditLog({
        id: 'log-' + Date.now(),
        action: 'ADD',
        recordId: newRec.id,
        organizationName: newRec.organization,
        details: `Added new verified emergency number for ${newRec.city}`,
        timestamp: new Date().toISOString(),
        adminName: 'Authorized Admin',
      });
    }

    handleResetForm();
    setActiveTab('records');
  };

  const handleDeleteRecord = (id: string, orgName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${orgName}?`)) return;
    onSaveRecords(records.filter((r) => r.id !== id));
    onAddAuditLog({
      id: 'log-' + Date.now(),
      action: 'DELETE',
      recordId: id,
      organizationName: orgName,
      details: 'Removed emergency record from active database',
      timestamp: new Date().toISOString(),
      adminName: 'Authorized Admin',
    });
  };

  const handleReverify = (record: EmergencyRecord) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = records.map((r) =>
      r.id === record.id
        ? {
            ...r,
            verificationStatus: 'VERIFIED' as const,
            verificationDate: today,
            lastUpdated: today,
          }
        : r
    );
    onSaveRecords(updated);
    onAddAuditLog({
      id: 'log-' + Date.now(),
      action: 'REVERIFY',
      recordId: record.id,
      organizationName: record.organization,
      details: `Reverified contact number on ${today}`,
      timestamp: new Date().toISOString(),
      adminName: 'Authorized Admin',
    });
  };

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `panezai_emergency_database_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onSaveRecords(parsed);
            alert(`Successfully restored ${parsed.length} emergency records!`);
          }
        } catch (err) {
          alert('Failed to parse backup JSON file.');
        }
      };
    }
  };

  // Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
        <div className="relative w-full max-w-sm bg-[#0C152B] border border-slate-700 rounded-2xl shadow-2xl p-6 text-white text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-amber-950/70 border border-amber-600/60 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-bold mb-1">{t.adminLogin}</h3>
          <p className="text-xs text-slate-400 mb-6">
            Strict verification controls. Only authorized network officers can modify official emergency numbers.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              autoFocus
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Admin PIN (Default: 1122)"
              className="w-full text-center text-xl tracking-widest font-mono bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl py-3 px-4 text-white focus:outline-none"
            />

            {pinError && (
              <p className="text-xs text-rose-400">
                Invalid Administrator PIN. Default is 1122.
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-sm transition-colors cursor-pointer shadow-lg shadow-amber-950/60"
            >
              {t.login}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredRecords = records.filter(
    (r) =>
      r.organization.toLowerCase().includes(filterQuery.toLowerCase()) ||
      r.phone.includes(filterQuery) ||
      r.city.toLowerCase().includes(filterQuery.toLowerCase()) ||
      r.district.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#091122] border border-slate-700 rounded-2xl shadow-2xl p-4 sm:p-6 text-white my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
              ADMIN
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>National Emergency Verification Portal</span>
                <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-emerald-400 border border-slate-700">
                  {records.length} Verified Records
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                PANEZAI EMERGENCY NETWORK Master Database Console
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

        {/* Tab Navigation */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto py-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('records')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'records' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              All Records ({records.length})
            </button>
            <button
              type="button"
              onClick={() => {
                handleResetForm();
                setActiveTab('add');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'add' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{editingRecordId ? 'Edit Record' : 'Add New Record'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'reports' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Flag className="w-3.5 h-3.5 text-rose-400" />
              <span>Reports ({reports.filter((r) => r.status === 'PENDING').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'history' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Logs</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Export JSON Backup"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Backup</span>
            </button>
            <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restore</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset emergency database to official factory numbers?')) {
                  onResetDb();
                }
              }}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Reset Database"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* TAB 1: ALL RECORDS */}
          {activeTab === 'records' && (
            <div className="space-y-3">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter admin records by organization, city, phone..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 mb-3"
              />

              <div className="space-y-2">
                {filteredRecords.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{r.organization}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                          {r.category}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            r.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {r.verificationStatus}
                        </span>
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        📞 <span className="font-mono text-emerald-400 font-bold">{r.phone}</span>
                        {r.altPhone && <span> · Alt: {r.altPhone}</span>} · 📍 {r.city}, {r.district}, {r.province}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Source: {r.officialSource} · Verified: {r.verificationDate} · Updated: {r.lastUpdated}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleReverify(r)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        title="Reverify today"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Reverify</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(r)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(r.id, r.organization)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ADD / EDIT FORM */}
          {activeTab === 'add' && (
            <form onSubmit={handleSaveRecord} className="space-y-4 max-w-3xl mx-auto">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                {editingRecordId ? 'Update Official Emergency Number' : 'Register New Verified Emergency Contact'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Province / Territory *</label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Emergency Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Bolan Medical Complex Trauma Centre"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Official Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 1122 or 081-9213070"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Alternative Phone Number</label>
                  <input
                    type="text"
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    placeholder="e.g. 081-9213072"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">District *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Quetta / Lahore / Karachi South"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">City / Town *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Quetta"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Tehsil / Taluka</label>
                  <input
                    type="text"
                    value={tehsil}
                    onChange={(e) => setTehsil(e.target.value)}
                    placeholder="e.g. Quetta Sadar"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Local Area / Sector</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Brewery Road"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Official Source *</label>
                  <input
                    type="text"
                    required
                    value={officialSource}
                    onChange={(e) => setOfficialSource(e.target.value)}
                    placeholder="e.g. Balochistan Health Dept Gazette"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Verification Status</label>
                  <select
                    value={verificationStatus}
                    onChange={(e) => setVerificationStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="VERIFIED">✅ VERIFIED</option>
                    <option value="PENDING">⚠️ PENDING VERIFICATION</option>
                    <option value="OUTDATED">❌ OUTDATED / UNAVAILABLE</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is247check"
                    checked={is24_7}
                    onChange={(e) => setIs24_7(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="is247check" className="text-slate-200 font-semibold cursor-pointer">
                    24/7 Round-the-Clock Emergency Availability
                  </label>
                </div>
              </div>

              {/* Coordinates for Distance & Navigation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">GPS Latitude (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="e.g. 30.1788"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">GPS Longitude (Optional)</label>
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="e.g. 66.9744"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold text-xs">Official Address / Landmark</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full physical address"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold text-xs">Verification Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Direct casualty trauma hotline, ICU standby"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    setActiveTab('records');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
                >
                  {editingRecordId ? 'Save Changes' : 'Publish Verified Record'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: USER REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-3">
              {reports.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/60 rounded-xl">
                  No citizen issue reports received yet.
                </div>
              ) : (
                reports.map((rep) => (
                  <div
                    key={rep.id}
                    className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      rep.status === 'RESOLVED'
                        ? 'bg-slate-900/40 border-slate-800 opacity-60'
                        : 'bg-rose-950/20 border-rose-800/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{rep.organizationName}</span>
                        <span className="text-[10px] bg-slate-800 text-rose-300 px-1.5 py-0.5 rounded font-semibold uppercase">
                          {rep.reason.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-slate-300 mt-1">
                        Reported Phone: <span className="font-mono text-rose-400 font-bold">{rep.reportedPhone}</span> · Location: {rep.location}
                      </div>
                      {rep.suggestedCorrection && (
                        <div className="text-slate-300 mt-1 bg-slate-900/80 p-2 rounded border border-slate-800">
                          <strong>Correction:</strong> {rep.suggestedCorrection}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1">
                        Reported at: {new Date(rep.createdAt).toLocaleString()} {rep.reporterPhone ? `by ${rep.reporterPhone}` : ''}
                      </div>
                    </div>

                    {rep.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => onResolveReport(rep.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer flex-shrink-0"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: AUDIT HISTORY LOG */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/60 rounded-xl">
                  No audit history records available.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-amber-400 font-mono mr-2">[{log.action}]</span>
                      <span className="text-white font-semibold mr-1">{log.organizationName}</span>
                      <span className="text-slate-400">— {log.details}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
