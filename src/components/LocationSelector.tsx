import React, { useState } from 'react';
import { MapPin, Navigation, ChevronDown, Check, RefreshCw } from 'lucide-react';
import { Coordinates, SupportedLanguage } from '../types/emergency.ts';
import { PROVINCES, DISTRICTS_BY_PROVINCE } from '../data/emergencyDatabase.ts';
import { TRANSLATIONS } from '../data/translations.ts';
import { findClosestPakistanCity } from '../utils/geoUtils.ts';

interface LocationSelectorProps {
  language: SupportedLanguage;
  selectedProvince: string;
  selectedDistrict: string;
  onProvinceChange: (province: string) => void;
  onDistrictChange: (district: string) => void;
  currentCoords: Coordinates | null;
  onLocationDetected: (coords: Coordinates, cityData: { city: string; district: string; province: string }) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  language,
  selectedProvince,
  selectedDistrict,
  onProvinceChange,
  onDistrictChange,
  currentCoords,
  onLocationDetected,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg('GPS Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetecting(false);
        const coords: Coordinates = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        const closest = findClosestPakistanCity(coords);
        onLocationDetected(coords, {
          city: closest.city,
          district: closest.district,
          province: closest.province,
        });
      },
      (err) => {
        setIsDetecting(false);
        console.warn('Geolocation error:', err);
        setErrorMsg('GPS permission denied or unavailable. Please select your province & district below.');
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  const districts = selectedProvince && DISTRICTS_BY_PROVINCE[selectedProvince]
    ? DISTRICTS_BY_PROVINCE[selectedProvince]
    : [];

  return (
    <div className="bg-[#0B1429] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/40">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: GPS Trigger & Detection Status */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={isDetecting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
          >
            {isDetecting ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Navigation className="w-4 h-4 text-emerald-100" />
            )}
            <span>{isDetecting ? t.locationDetecting : '📍 Auto-Detect GPS Location'}</span>
          </button>

          {currentCoords ? (
            <div className="inline-flex items-center gap-2 text-xs font-semibold bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>GPS Active:</span>
              <span className="font-mono text-white">
                {currentCoords.lat.toFixed(3)}°N, {currentCoords.lng.toFixed(3)}°E
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">
              Auto-detects closest city or select manually below
            </span>
          )}
        </div>

        {/* Right: Cascading Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
          {/* Province Selector */}
          <div className="relative">
            <select
              value={selectedProvince}
              onChange={(e) => {
                const prov = e.target.value;
                onProvinceChange(prov);
                onDistrictChange('all');
              }}
              className="w-full appearance-none bg-slate-900/90 border border-slate-700 hover:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 pr-8 transition-colors cursor-pointer"
            >
              {PROVINCES.map((prov) => (
                <option key={prov} value={prov} className="bg-slate-900 text-white">
                  {prov}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* District Selector */}
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => onDistrictChange(e.target.value)}
              className="w-full appearance-none bg-slate-900/90 border border-slate-700 hover:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 pr-8 transition-colors cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">
                {t.allDistricts} ({selectedProvince === 'All Pakistan / National' ? 'Nationwide' : selectedProvince})
              </option>
              {districts.map((dist) => (
                <option key={dist} value={dist} className="bg-slate-900 text-white">
                  {dist}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 text-xs text-amber-300/90 bg-amber-950/40 border border-amber-800/40 rounded-lg p-2.5">
          {errorMsg}
        </div>
      )}
    </div>
  );
};
