'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/utils';

// Format month for display
function formatMonth(monthKey) {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return new Intl.DateTimeFormat('de-DE', {
    month: 'short',
    year: '2-digit',
  }).format(date);
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-4 rounded-xl shadow-elevated border border-gray-100">
      <p className="font-medium text-gray-900 mb-2">{formatMonth(label)}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium text-gray-900">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

// Combined revenue bar chart (for overview page)
export function RevenueBreakdownChart({ data, loading }) {
  if (loading) {
    return <div className="h-80 loading-shimmer rounded-xl" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-container flex items-center justify-center h-80">
        <p className="text-gray-500">Keine Daten verfügbar</p>
      </div>
    );
  }

  const colors = {
    saasYearly: '#006368',
    saasMonthly: '#008a91',
    saasSingle: '#00b4b8',
    agencyStripe: '#a5f7c0',
    agencySevdesk: '#7dd99e',
    sheetsManual: '#5bc27a',
  };

  const labels = {
    saasYearly: 'SaaS Jahresabos',
    saasMonthly: 'SaaS Monatsabos',
    saasSingle: 'SaaS Einzelvideos',
    agencyStripe: 'Agentur (Stripe)',
    agencySevdesk: 'Agentur (Sevdesk)',
    sheetsManual: 'Manuelle Einträge',
  };

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Umsatz nach Kategorie</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="month" 
            tickFormatter={formatMonth}
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis 
            tickFormatter={(v) => `€${formatNumber(v / 1000)}k`}
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
          />
          {Object.entries(colors).map(([key, color]) => (
            <Bar 
              key={key}
              dataKey={key}
              name={labels[key]}
              fill={color}
              stackId="revenue"
              radius={[0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// MRR development line chart
export function MRRChart({ data, loading }) {
  if (loading) {
    return <div className="h-80 loading-shimmer rounded-xl" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-container flex items-center justify-center h-80">
        <p className="text-gray-500">Keine Daten verfügbar</p>
      </div>
    );
  }

  // Calculate cumulative MRR
  let cumulativeMRR = 0;
  const chartData = data.map(item => {
    cumulativeMRR += (item.inflow || 0) - (item.outflow || 0);
    return {
      ...item,
      mrr: Math.max(0, cumulativeMRR),
    };
  });

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">MRR Entwicklung</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#006368" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#006368" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="month" 
            tickFormatter={formatMonth}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(v) => `€${formatNumber(v)}`}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="mrr" 
            name="MRR"
            stroke="#006368" 
            strokeWidth={3}
            fill="url(#mrrGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Inflow/Outflow chart
export function InflowOutflowChart({ data, loading }) {
  if (loading) {
    return <div className="h-80 loading-shimmer rounded-xl" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-container flex items-center justify-center h-80">
        <p className="text-gray-500">Keine Daten verfügbar</p>
      </div>
    );
  }

  // Add net calculation
  const chartData = data.map(d => ({ 
    ...d, 
    net: (d.inflow || 0) - (d.outflow || 0) 
  }));

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Abonnement-Dynamik (Inflow vs Outflow)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="month" 
            tickFormatter={formatMonth}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(v) => `€${formatNumber(v)}`}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="inflow" name="Neuer MRR" fill="#a5f7c0" radius={[4, 4, 0, 0]} />
          <Bar dataKey="outflow" name="Verlorener MRR" fill="#f87171" radius={[4, 4, 0, 0]} />
          <Line 
            type="monotone" 
            dataKey="net" 
            name="Netto"
            stroke="#006368" 
            strokeWidth={2}
            dot={{ fill: '#006368', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Agency revenue bar chart
export function AgencyRevenueChart({ data, loading }) {
  if (loading) {
    return <div className="h-80 loading-shimmer rounded-xl" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-container flex items-center justify-center h-80">
        <p className="text-gray-500">Keine Daten verfügbar</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Agentur Umsatz</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="month" 
            tickFormatter={formatMonth}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(v) => `€${formatNumber(v)}`}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="stripeRevenue" 
            name="Einzelvideos (Stripe)" 
            fill="#006368" 
            stackId="revenue"
            radius={[0, 0, 0, 0]}
          />
          <Bar 
            dataKey="sevdeskRevenue" 
            name="Videopakete (Sevdesk)" 
            fill="#a5f7c0" 
            stackId="revenue"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// SaaS Revenue breakdown chart
export function SaaSRevenueChart({ data, loading }) {
  if (loading) {
    return <div className="h-80 loading-shimmer rounded-xl" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-container flex items-center justify-center h-80">
        <p className="text-gray-500">Keine Daten verfügbar</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">SaaS Umsatz nach Typ</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="month" 
            tickFormatter={formatMonth}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(v) => `€${formatNumber(v)}`}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="yearly" 
            name="Jahresabos" 
            fill="#006368" 
            stackId="revenue"
          />
          <Bar 
            dataKey="monthly" 
            name="Monatsabos" 
            fill="#008a91" 
            stackId="revenue"
          />
          <Bar 
            dataKey="single" 
            name="Einzelkäufe" 
            fill="#a5f7c0" 
            stackId="revenue"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
