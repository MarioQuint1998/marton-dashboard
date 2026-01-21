'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent, formatTrend } from '@/lib/utils';

export default function MetricCard({ 
  label, 
  value, 
  format = 'currency', 
  trend, 
  subtitle,
  icon: Icon,
  size = 'default',
  loading = false,
}) {
  // Format the value based on type
  const formattedValue = loading ? '—' : (() => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'number':
        return formatNumber(value);
      case 'percent':
        return formatPercent(value);
      case 'days':
        return `${formatNumber(value, 1)} Tage`;
      default:
        return value;
    }
  })();

  // Trend indicator
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-400';

  const sizeClasses = {
    small: 'p-4',
    default: 'p-6',
    large: 'p-8',
  };

  const valueClasses = {
    small: 'text-2xl',
    default: 'text-3xl',
    large: 'text-4xl',
  };

  return (
    <div className={`metric-card ${sizeClasses[size]} ${loading ? 'animate-pulse' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="metric-label">{label}</span>
        {Icon && (
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
      
      <div className={`metric-value ${valueClasses[size]} ${loading ? 'skeleton h-9 w-32' : ''}`}>
        {!loading && formattedValue}
      </div>
      
      {(trend !== undefined || subtitle) && (
        <div className="flex items-center gap-2 mt-3">
          {trend !== undefined && !loading && (
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{formatTrend(trend)}</span>
            </div>
          )}
          {subtitle && (
            <span className="text-sm text-gray-500">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for multiple metrics in a row
export function MetricCardCompact({ label, value, format = 'currency', loading = false }) {
  const formattedValue = loading ? '—' : (() => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'number':
        return formatNumber(value);
      case 'percent':
        return formatPercent(value);
      default:
        return value;
    }
  })();

  return (
    <div className={`bg-white/60 backdrop-blur rounded-xl p-4 ${loading ? 'animate-pulse' : ''}`}>
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</span>
      <div className={`text-xl font-bold text-gray-900 mt-1 ${loading ? 'skeleton h-7 w-20' : ''}`}>
        {!loading && formattedValue}
      </div>
    </div>
  );
}

// Valuation card with multiple multipliers
export function ValuationCard({ arr, loading = false }) {
  const multipliers = [3, 5, 8];
  
  return (
    <div className="metric-card">
      <span className="metric-label">Firmenbewertung (ARR Multiple)</span>
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        {multipliers.map(mult => (
          <div key={mult} className="text-center">
            <div className="text-xs text-gray-500 mb-1">{mult}x ARR</div>
            <div className={`text-lg font-bold text-primary ${loading ? 'skeleton h-6 w-full' : ''}`}>
              {!loading && formatCurrency(arr * mult, 0)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
