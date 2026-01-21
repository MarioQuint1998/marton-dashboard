'use client';

import { LayoutDashboard, Cpu, Building2, Lightbulb } from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Übersicht', icon: LayoutDashboard },
  { id: 'saas', label: 'marton.ai', icon: Cpu },
  { id: 'agency', label: 'Raumblick360', icon: Building2 },
  { id: 'insights', label: 'Software Insights', icon: Lightbulb },
];

export default function Navigation({ activeTab, onTabChange }) {
  return (
    <nav className="flex gap-2 bg-white/80 backdrop-blur p-1.5 rounded-2xl shadow-soft">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              isActive
                ? 'bg-primary text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
