import React, { useState } from 'react';
import { Navigation, PhoneCall, ShieldCheck, MapPin, Compass, AlertCircle } from 'lucide-react';
import { Coordinates, EmergencyRecord, SupportedLanguage } from '../types/emergency.ts';
import { TRANSLATIONS } from '../data/translations.ts';
import { calculateHaversineDistance, getDirectionsUrl } from '../utils/geoUtils.ts';

interface NearestServicesProps {
  records: EmergencyRecord[];
  currentCoords: Coordinates | null;
  language: SupportedLanguage;
  onSelectRecordForReport: (record: EmergencyRecord) => void;
  onRequestGPS: () => void;
}

const NEAREST_FILTER_TABS = [
  { id: 'all', label: 'All Services', icon: '🚨' },
  { id: 'Hospital Emergency', label: 'Hospitals', icon: '🏥' },
  { id: 'Ambulance', label: 'Ambulances', icon: '🚑' },
  { id: 'Police', label: 'Police Stations', icon: '👮' },
  { id: 'Fire Brigade', label: 'Fire Stations', icon: '🚒' },
  { id: 'Blood Bank', label: 'Blood Banks', icon: '🩸' },
  { id: 'Emergency Pharmacy', label: 'Pharmacies', icon: '💊' },
  { id: 'Mechanic', label: 'Mechanics', icon: '🛠️' },
  { id: 'Towing / Roadside Assistance', label: 'Towing', icon: '🚗' },
];

export const NearestServices: React.FC<NearestServicesProps> = ({
  records,
  currentCoords,
  language,
  onSelectRecordForReport,
  onRequestGPS,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [activeTab, setActiveTab] = useState('all');

  if (!currentCoords) {
    return (
      <div className="bg-[#0D1730] border-2 border-dashed border-slate-700/80 rounded-2xl p-8 text-center max-w-xl mx-auto my-6">
        <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <Compass className="w-8 h-8 animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">GPS Location Required for Nearest Facility Calculations</h3>
        <p className="text-sm text-slate-300 mb-6">
          Enable GPS to find nearest 24/7 trauma hospitals, ambulance stations, fire departments, and police units calculated by road distance.
        </p>
        <button
          type="button"
          onClick={onRequestGPS}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 inline-flex items-center gap-2 cursor-pointer transition-all"
        >
          <Navigation className="w-4 h-4" />
          <span>Enable GPS Location</span>
        </button>
      </div>
    );
  }

  // Calculate live distance for all records that have coordinates
  const recordsWithDistance = records
    .filter((r) => r.coordinates)
    .map((r) => {
      const distance = calculateHaversineDistance(currentCoords, r.coordinates!);
      return {
        ...r,
        distanceKm: distance,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  // Filter by active tab
  const filteredRecords = activeTab === 'all'
    ? recordsWithDistance
    : recordsWithDistance.filter((r) => r.category === activeTab);

  return (
    <div className="space-y-4">
      {/* Category Sub-Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {NEAREST_FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/60'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing {filteredRecords.length} nearest verified emergency facilities sorted by live distance
        </span>
        <span className="font-mono text-emerald-400">
          📍 From Your Location ({currentCoords.lat.toFixed(3)}, {currentCoords.lng.toFixed(3)})
        </span>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="bg-[#0C152B] border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
          <p className="text-base font-semibold text-white mb-1">
            {t.noNumbersFound}
          </p>
          <p className="text-xs">
            {t.noNumbersFoundDesc}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((item) => (
            <div
              key={item.id}
              className="bg-[#0C152B] border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg shadow-black/40"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-white bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg">
                    {item.distanceKm} km away
                  </span>
                </div>

                <h4 className="text-base font-bold text-white mb-1">{item.organization}</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <span>{item.address || `${item.city}, ${item.district}`}</span>
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mb-4">
                  <span className="text-emerald-400 font-semibold">
                    ✅ {item.verificationStatus}
                  </span>
                  <span>·</span>
                  <span>Verified: {item.verificationDate}</span>
                  <span>·</span>
                  <span>{item.officialSource}</span>
                </div>
              </div>

              {/* Big Call & Directions Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <a
                  href={`tel:${item.phone}`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-950/60 transition-all cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>CALL {item.phone}</span>
                </a>

                {item.coordinates && (
                  <a
                    href={getDirectionsUrl(item.coordinates.lat, item.coordinates.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm border border-slate-700 transition-colors"
                  >
                    <Navigation className="w-4 h-4 text-emerald-400" />
                    <span>DIRECTIONS</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
