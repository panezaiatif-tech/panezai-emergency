import React from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { EmergencyCategory, SupportedLanguage } from '../types/emergency.ts';
import { CATEGORIES } from '../data/emergencyDatabase.ts';
import { CATEGORY_TRANSLATIONS, TRANSLATIONS } from '../data/translations.ts';

interface EmergencySearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  language: SupportedLanguage;
}

const QUICK_SEARCH_EXAMPLES = [
  'Police number Quetta',
  'Ambulance Peshawar',
  'Fire brigade Karachi',
  'Hospital emergency Multan',
  'Emergency number Lahore',
  'Motorway Police 130',
  'Mechanic near me',
  'Blood Bank',
  'Gas emergency 1199',
];

export const EmergencySearchBar: React.FC<EmergencySearchBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const catNames = CATEGORY_TRANSLATIONS[language] || CATEGORY_TRANSLATIONS.en;

  return (
    <div className="space-y-3">
      {/* Search Input Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5 text-emerald-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full bg-[#0D1832] border-2 border-slate-700/80 focus:border-emerald-500 rounded-2xl py-3.5 pl-11 pr-10 text-white placeholder-slate-400 text-sm sm:text-base font-medium shadow-inner shadow-black/50 focus:outline-none transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Search Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin text-xs">
        <div className="flex items-center gap-1 text-slate-400 flex-shrink-0 font-medium pl-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick:</span>
        </div>
        {QUICK_SEARCH_EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onSearchChange(example)}
            className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white whitespace-nowrap transition-colors flex-shrink-0"
          >
            {example}
          </button>
        ))}
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          type="button"
          onClick={() => onCategoryChange('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex-shrink-0 cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/50'
              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
          }`}
        >
          {t.allCategories}
        </button>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          const label = catNames[cat] || cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex-shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/50'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
