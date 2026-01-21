// Format currency (Euro)
export function formatCurrency(amount, decimals = 2) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

// Format number with German locale
export function formatNumber(num, decimals = 0) {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

// Format percentage
export function formatPercent(num, decimals = 1) {
  return `${formatNumber(num, decimals)}%`;
}

// Format date for display
export function formatDate(date) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

// Format month for charts
export function formatMonth(monthKey) {
  const [year, month] = monthKey.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return new Intl.DateTimeFormat('de-DE', {
    month: 'short',
    year: '2-digit',
  }).format(date);
}

// Get date range presets
export function getDatePresets() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Start of this week (Monday)
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - diffToMonday);
  
  // Start of this month
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // Start of last month
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  
  // Start of this quarter
  const currentQuarter = Math.floor(today.getMonth() / 3);
  const startOfQuarter = new Date(today.getFullYear(), currentQuarter * 3, 1);
  
  // Start of this year
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  
  // All time (arbitrary past date)
  const allTimeStart = new Date(2020, 0, 1);

  return {
    today: {
      label: 'Heute',
      start: today,
      end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
    },
    thisWeek: {
      label: 'Diese Woche',
      start: startOfWeek,
      end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
    },
    thisMonth: {
      label: 'Dieser Monat',
      start: startOfMonth,
      end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
    },
    lastMonth: {
      label: 'Letzter Monat',
      start: startOfLastMonth,
      end: endOfLastMonth,
    },
    thisQuarter: {
      label: 'Dieses Quartal',
      start: startOfQuarter,
      end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
    },
    thisYear: {
      label: 'Dieses Jahr',
      start: startOfYear,
      end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
    },
    allTime: {
      label: 'Gesamter Zeitraum',
      start: allTimeStart,
      end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
    },
  };
}

// Calculate trend (comparison with previous period)
export function calculateTrend(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Format trend for display
export function formatTrend(trendPercent) {
  const sign = trendPercent >= 0 ? '+' : '';
  return `${sign}${formatNumber(trendPercent, 1)}%`;
}

// Aggregate monthly data
export function aggregateByMonth(data, dateField, valueField) {
  const aggregated = {};
  
  for (const item of data) {
    const date = new Date(item[dateField]);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!aggregated[monthKey]) {
      aggregated[monthKey] = 0;
    }
    aggregated[monthKey] += item[valueField] || 0;
  }
  
  return Object.entries(aggregated)
    .map(([month, value]) => ({ month, value }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// Merge monthly breakdowns from different sources
export function mergeMonthlyBreakdowns(...breakdowns) {
  const merged = {};
  
  for (const breakdown of breakdowns) {
    if (!breakdown) continue;
    
    for (const item of breakdown) {
      const monthKey = item.month;
      if (!merged[monthKey]) {
        merged[monthKey] = { month: monthKey };
      }
      
      for (const [key, value] of Object.entries(item)) {
        if (key === 'month') continue;
        merged[monthKey][key] = (merged[monthKey][key] || 0) + (value || 0);
      }
    }
  }
  
  return Object.values(merged).sort((a, b) => a.month.localeCompare(b.month));
}

// Calculate company valuation
export function calculateValuation(arr, multipliers = [3, 5, 8]) {
  return multipliers.map(mult => ({
    multiplier: mult,
    valuation: arr * mult,
  }));
}

// Safely parse dates from form inputs
export function parseInputDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

// Convert date to input format (YYYY-MM-DD)
export function toInputDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}
