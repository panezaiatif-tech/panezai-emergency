import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  PhoneCall,
  ShieldCheck,
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Crosshair,
} from 'lucide-react';
import type { Coordinates, EmergencyRecord, SupportedLanguage } from '../types/emergency.ts';
import { calculateHaversineDistance, getDirectionsUrl } from '../utils/geoUtils.ts';

interface EmergencyMapProps {
  records: EmergencyRecord[];
  currentCoords: Coordinates | null;
  language: SupportedLanguage;
  onCallNumber: (phone: string, name?: string) => void;
}

// Bounding box for Pakistan coordinates
const MIN_LNG = 60.5;
const MAX_LNG = 77.5;
const MIN_LAT = 23.5;
const MAX_LAT = 37.2;

const SVG_WIDTH = 900;
const SVG_HEIGHT = 760;

function projectCoords(lat: number, lng: number): { x: number; y: number } {
  // Clamping to Pakistan viewport
  const clampedLat = Math.max(MIN_LAT, Math.min(MAX_LAT, lat));
  const clampedLng = Math.max(MIN_LNG, Math.min(MAX_LNG, lng));

  const x = ((clampedLng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * (SVG_WIDTH - 80) + 40;
  const y = ((MAX_LAT - clampedLat) / (MAX_LAT - MIN_LAT)) * (SVG_HEIGHT - 80) + 40;

  return { x: Math.round(x), y: Math.round(y) };
}

const CATEGORY_MAP_ICONS: Record<string, { icon: string; bg: string; text: string }> = {
  'Hospital Emergency': { icon: '🏥', bg: 'bg-red-600', text: 'text-red-400' },
  'Ambulance': { icon: '🚑', bg: 'bg-red-700', text: 'text-red-300' },
  'Rescue Services': { icon: '🆘', bg: 'bg-rose-600', text: 'text-rose-400' },
  'Police': { icon: '👮', bg: 'bg-blue-600', text: 'text-blue-400' },
  'Fire Brigade': { icon: '🚒', bg: 'bg-amber-600', text: 'text-amber-400' },
  'Blood Bank': { icon: '🩸', bg: 'bg-rose-700', text: 'text-rose-300' },
  'Emergency Pharmacy': { icon: '💊', bg: 'bg-teal-600', text: 'text-teal-400' },
  'Mechanic': { icon: '🛠️', bg: 'bg-orange-600', text: 'text-orange-400' },
  'Towing / Roadside Assistance': { icon: '🚗', bg: 'bg-purple-600', text: 'text-purple-400' },
  'Motorway / Highway Police': { icon: '🚓', bg: 'bg-emerald-600', text: 'text-emerald-400' },
  'Mountain Rescue': { icon: '🏔️', bg: 'bg-cyan-600', text: 'text-cyan-400' },
  'Flood Rescue': { icon: '🌊', bg: 'bg-sky-600', text: 'text-sky-400' },
};

// Major Pakistani National Highway Lines (Coordinates)
const HIGHWAYS = [
  {
    name: 'N-5 GT Road & National Highway (Karachi -> Hyderabad -> Multan -> Lahore -> Rawalpindi -> Peshawar)',
    color: '#F59E0B',
    points: [
      { lat: 24.86, lng: 67.0 },
      { lat: 25.39, lng: 68.35 },
      { lat: 27.7, lng: 68.85 },
      { lat: 30.15, lng: 71.52 },
      { lat: 31.52, lng: 74.35 },
      { lat: 32.18, lng: 74.19 },
      { lat: 33.59, lng: 73.04 },
      { lat: 34.01, lng: 71.52 }
    ]
  },
  {
    name: 'M-2 / M-1 Motorway (Lahore -> Islamabad -> Peshawar)',
    color: '#10B981',
    points: [
      { lat: 31.52, lng: 74.35 },
      { lat: 32.0, lng: 73.5 },
      { lat: 33.0, lng: 73.1 },
      { lat: 33.68, lng: 73.04 },
      { lat: 34.01, lng: 71.52 }
    ]
  },
  {
    name: 'N-25 RCD Highway (Karachi -> Khuzdar -> Kalat -> Quetta -> Chaman)',
    color: '#3B82F6',
    points: [
      { lat: 24.99, lng: 66.88 },
      { lat: 26.2, lng: 66.3 },
      { lat: 27.81, lng: 66.61 },
      { lat: 29.0, lng: 66.58 },
      { lat: 30.17, lng: 66.97 },
      { lat: 30.92, lng: 66.45 }
    ]
  },
  {
    name: 'M-5 Motorway (Multan -> Sukkur)',
    color: '#8B5CF6',
    points: [
      { lat: 30.15, lng: 71.52 },
      { lat: 29.3, lng: 71.2 },
      { lat: 28.4, lng: 70.3 },
      { lat: 27.7, lng: 68.85 }
    ]
  },
  {
    name: 'N-35 Karakoram Highway (Islamabad -> Abbottabad -> Gilgit -> Hunza)',
    color: '#EC4899',
    points: [
      { lat: 33.68, lng: 73.04 },
      { lat: 34.16, lng: 73.22 },
      { lat: 34.7, lng: 73.2 },
      { lat: 35.4, lng: 74.1 },
      { lat: 35.92, lng: 74.31 },
      { lat: 36.31, lng: 74.61 }
    ]
  },
  {
    name: 'N-50 Zhob Highway (Quetta -> Pishin -> Muslim Bagh -> Zhob -> D.I. Khan)',
    color: '#06B6D4',
    points: [
      { lat: 30.17, lng: 66.97 },
      { lat: 30.58, lng: 66.99 },
      { lat: 30.8, lng: 67.7 },
      { lat: 31.34, lng: 69.44 },
      { lat: 31.8, lng: 70.9 }
    ]
  }
];

export const EmergencyMap: React.FC<EmergencyMapProps> = ({
  records,
  currentCoords,
  language,
  onCallNumber,
}) => {
  const [selectedFacility, setSelectedFacility] = useState<EmergencyRecord | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showHighways, setShowHighways] = useState<boolean>(true);

  // Filter facilities with coordinates
  const facilitiesWithCoords = useMemo(() => {
    return records
      .filter((r) => r.coordinates && r.coordinates.lat && r.coordinates.lng)
      .filter((r) => filterCategory === 'all' || r.category === filterCategory)
      .map((r) => {
        const pt = projectCoords(r.coordinates!.lat, r.coordinates!.lng);
        const dist = currentCoords
          ? calculateHaversineDistance(currentCoords, r.coordinates!)
          : undefined;
        return {
          ...r,
          projX: pt.x,
          projY: pt.y,
          distanceKm: dist,
        };
      });
  }, [records, filterCategory, currentCoords]);

  // Projected user GPS marker
  const userMarker = useMemo(() => {
    if (!currentCoords) return null;
    return projectCoords(currentCoords.lat, currentCoords.lng);
  }, [currentCoords]);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.2, z + 0.25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.85, z - 0.25));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="bg-[#091122] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-3">
      {/* Top Map Control Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Interactive Offline Vector Map of Pakistan</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            Live Emergency Services & Highways Navigation
          </h3>
          <p className="text-xs text-slate-400">
            Click any facility pin to view 24/7 verification status, live distance, and 1-tap dial.
          </p>
        </div>

        {/* Filter categories */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">📍 All Emergency Facilities ({facilitiesWithCoords.length})</option>
            <option value="Hospital Emergency">🏥 Hospitals & Trauma Centers</option>
            <option value="Ambulance">🚑 Ambulance Services</option>
            <option value="Police">👮 Police Stations</option>
            <option value="Fire Brigade">🚒 Fire Stations</option>
            <option value="Blood Bank">🩸 Blood Banks</option>
            <option value="Motorway / Highway Police">🚓 Motorway Police</option>
            <option value="Towing / Roadside Assistance">🚗 Towing & Mechanics</option>
          </select>

          {/* Highway Toggle */}
          <button
            type="button"
            onClick={() => setShowHighways(!showHighways)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showHighways ? 'bg-amber-600/90 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Highways</span>
          </button>
        </div>
      </div>

      {/* Map Canvas Frame */}
      <div className="relative w-full h-[520px] sm:h-[620px] bg-gradient-to-b from-[#060D1A] via-[#091326] to-[#040814] overflow-hidden select-none">
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1.5 shadow-xl">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-950/85 backdrop-blur border border-slate-800 rounded-2xl p-2.5 text-[11px] text-slate-300 space-y-1 hidden sm:block max-w-xs shadow-xl">
          <div className="font-bold text-white mb-1">National Legend:</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-amber-400"></span>
            <span>N-5 GT Road</span>
            <span className="w-3 h-0.5 bg-emerald-400 ml-2"></span>
            <span>M-1 / M-2 Motorways</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-blue-400"></span>
            <span>N-25 RCD Highway</span>
            <span className="w-3 h-0.5 bg-pink-400 ml-2"></span>
            <span>N-35 Karakoram</span>
          </div>
          {currentCoords && (
            <div className="pt-1 flex items-center gap-1.5 text-sky-400 font-mono text-[10px]">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
              <span>Your GPS: {currentCoords.lat.toFixed(2)}°N, {currentCoords.lng.toFixed(2)}°E</span>
            </div>
          )}
        </div>

        {/* SVG Pakistan Vector Canvas */}
        <div
          className="w-full h-full transition-transform duration-300 flex items-center justify-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-full"
            style={{ maxHeight: '100%' }}
          >
            {/* Background Grid Pattern */}
            <defs>
              <pattern id="pakGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#pakGrid)" />

            {/* Stylized Pakistan Region Outlines */}
            {/* Balochistan Territory */}
            <polygon
              points="140,430 220,380 340,360 410,480 360,600 240,640 180,620 120,530"
              fill="#062817"
              fillOpacity="0.45"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <text x="240" y="500" fill="#10B981" fillOpacity="0.35" fontSize="18" fontWeight="bold" fontFamily="sans-serif">
              BALOCHISTAN
            </text>

            {/* Sindh Territory */}
            <polygon
              points="360,600 440,540 500,560 520,680 430,730 380,710 350,650"
              fill="#062817"
              fillOpacity="0.4"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <text x="420" y="650" fill="#10B981" fillOpacity="0.35" fontSize="16" fontWeight="bold" fontFamily="sans-serif">
              SINDH
            </text>

            {/* Punjab Territory */}
            <polygon
              points="380,360 530,300 620,360 610,500 480,560 410,480"
              fill="#062817"
              fillOpacity="0.45"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <text x="480" y="440" fill="#10B981" fillOpacity="0.35" fontSize="18" fontWeight="bold" fontFamily="sans-serif">
              PUNJAB
            </text>

            {/* Khyber Pakhtunkhwa (KP) Territory */}
            <polygon
              points="440,170 520,130 550,220 500,320 400,350 430,260"
              fill="#062817"
              fillOpacity="0.4"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <text x="440" y="240" fill="#10B981" fillOpacity="0.35" fontSize="16" fontWeight="bold" fontFamily="sans-serif">
              KHYBER PAKHTUNKHWA
            </text>

            {/* Gilgit-Baltistan & AJK */}
            <polygon
              points="530,90 670,80 720,160 620,240 550,210 530,120"
              fill="#062817"
              fillOpacity="0.45"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <text x="590" y="150" fill="#10B981" fillOpacity="0.35" fontSize="16" fontWeight="bold" fontFamily="sans-serif">
              GILGIT-BALTISTAN & AJK
            </text>

            {/* Render Major Highways */}
            {showHighways &&
              HIGHWAYS.map((hw, idx) => {
                const pathData = hw.points
                  .map((p, i) => {
                    const { x, y } = projectCoords(p.lat, p.lng);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ');
                return (
                  <path
                    key={idx}
                    d={pathData}
                    stroke={hw.color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity="0.85"
                  />
                );
              })}

            {/* Render Facility Markers */}
            {facilitiesWithCoords.map((fac) => {
              const meta = CATEGORY_MAP_ICONS[fac.category] || {
                icon: '🚨',
                bg: 'bg-emerald-600',
                text: 'text-emerald-400',
              };
              const isSelected = selectedFacility?.id === fac.id;

              return (
                <g
                  key={fac.id}
                  className="cursor-pointer transition-transform hover:scale-125"
                  onClick={() => setSelectedFacility(fac)}
                >
                  {/* Pin circle halo */}
                  <circle
                    cx={fac.projX}
                    cy={fac.projY}
                    r={isSelected ? 16 : 11}
                    fill={isSelected ? '#EF4444' : '#0B132B'}
                    stroke={isSelected ? '#FFFFFF' : '#10B981'}
                    strokeWidth={isSelected ? 3 : 2}
                    className="drop-shadow-lg"
                  />
                  {/* Category Emoji inside marker */}
                  <text
                    x={fac.projX}
                    y={fac.projY + 4}
                    textAnchor="middle"
                    fontSize={isSelected ? 14 : 11}
                    pointerEvents="none"
                  >
                    {meta.icon}
                  </text>
                </g>
              );
            })}

            {/* User GPS Location Beacon */}
            {userMarker && (
              <g>
                <circle
                  cx={userMarker.x}
                  cy={userMarker.y}
                  r="20"
                  fill="#38BDF8"
                  fillOpacity="0.2"
                  className="animate-ping"
                />
                <circle
                  cx={userMarker.x}
                  cy={userMarker.y}
                  r="9"
                  fill="#0284C7"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />
                <circle cx={userMarker.x} cy={userMarker.y} r="3" fill="#FFFFFF" />
              </g>
            )}
          </svg>
        </div>

        {/* Selected Facility Interactive Card Popup */}
        {selectedFacility && (
          <div className="absolute top-4 left-4 z-30 w-80 sm:w-96 bg-[#0B152B]/95 backdrop-blur border-2 border-emerald-500 rounded-3xl p-4 sm:p-5 shadow-2xl text-left animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                {selectedFacility.category}
              </span>
              <button
                type="button"
                onClick={() => setSelectedFacility(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800"
              >
                ✕
              </button>
            </div>

            <h4 className="text-base font-bold text-white leading-tight">
              {selectedFacility.organization}
            </h4>

            <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span>{selectedFacility.city}, {selectedFacility.district}</span>
              {selectedFacility.distanceKm !== undefined && (
                <span className="font-mono text-emerald-400 font-bold ml-auto">
                  {selectedFacility.distanceKm} km away
                </span>
              )}
            </p>

            <div className="text-[11px] text-slate-400 mt-2">
              <span>Verified: {selectedFacility.verificationDate} · Source: {selectedFacility.officialSource}</span>
            </div>

            {/* Actions: Call & Directions */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => onCallNumber(selectedFacility.phone, selectedFacility.organization)}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-950 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>CALL NOW</span>
              </button>

              {selectedFacility.coordinates && (
                <a
                  href={getDirectionsUrl(selectedFacility.coordinates.lat, selectedFacility.coordinates.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span>DIRECTIONS</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
