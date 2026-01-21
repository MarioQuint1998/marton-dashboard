'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { getDatePresets, toInputDate } from '@/lib/utils';

export default function DatePicker({ startDate, endDate, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState('thisMonth');
  const [customStart, setCustomStart] = useState(toInputDate(startDate));
  const [customEnd, setCustomEnd] = useState(toInputDate(endDate));
  const dropdownRef = useRef(null);

  const presets = getDatePresets();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update custom inputs when props change
  useEffect(() => {
    setCustomStart(toInputDate(startDate));
    setCustomEnd(toInputDate(endDate));
  }, [startDate, endDate]);

  const handlePresetClick = (presetKey) => {
    const preset = presets[presetKey];
    setActivePreset(presetKey);
    onChange(preset.start, preset.end);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      setActivePreset('custom');
      onChange(start, end);
      setIsOpen(false);
    }
  };

  // Format the display label
  const getDisplayLabel = () => {
    if (activePreset === 'custom') {
      return `${new Date(startDate).toLocaleDateString('de-DE')} - ${new Date(endDate).toLocaleDateString('de-DE')}`;
    }
    return presets[activePreset]?.label || 'Zeitraum wählen';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-gray-200 hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
      >
        <Calendar className="w-5 h-5 text-primary" />
        <span className="font-medium text-gray-700">{getDisplayLabel()}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-elevated border border-gray-100 p-4 z-50 min-w-[320px] animate-fade-in">
          {/* Presets */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {Object.entries(presets).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handlePresetClick(key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activePreset === key
                    ? 'bg-primary text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-4" />

          {/* Custom range */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-500">Benutzerdefiniert</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Von</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Bis</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleCustomApply}
              className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Anwenden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
