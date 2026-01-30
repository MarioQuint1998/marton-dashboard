'use client';
import { useState, useEffect } from 'react';

// Format helpers
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('de-DE', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(amount) + ' €';
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Cancellation reason translations
const reasonTranslations = {
  'cancellation_requested': 'Auf Kundenwunsch',
  'payment_failed': 'Zahlungsfehler',
  'payment_disputed': 'Zahlung angefochten',
  'too_expensive': 'Zu teuer',
  'missing_features': 'Fehlende Features',
  'switched_service': 'Zu anderem Anbieter gewechselt',
  'unused': 'Nicht genutzt',
  'customer_service': 'Kundenservice',
  'too_complex': 'Zu kompliziert',
  'low_quality': 'Qualität nicht ausreichend',
  'other': 'Sonstiges',
  'Nicht angegeben': 'Nicht angegeben'
};

// Icons
const Icons = {
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  UserMinus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Download: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Mail: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
};

// Login Component
function LoginPage({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (res.ok) {
        localStorage.setItem('dashboard_authenticated', 'true');
        onLogin();
      } else {
        setError('Falsches Passwort');
      }
    } catch (err) {
      setError('Verbindungsfehler');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 50%, #fce4ec 100%)'}}>
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center text-sm text-gray-400">Logo</div>
          <h1 className="text-2xl font-bold text-gray-800">Business Dashboard</h1>
          <p className="text-gray-500 mt-1">marton.ai & Raumblick360</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Passwort</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Passwort eingeben"
              />
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium"
          >
            {loading ? 'Wird geladen...' : 'Anmelden'}
          </button>
        </form>
        
        <p className="text-center text-gray-400 text-sm mt-6">Internes Dashboard für Team-Mitglieder</p>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [data, setData] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [churned, setChurned] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Check authentication
  useEffect(() => {
    const isAuth = localStorage.getItem('dashboard_authenticated');
    setAuthenticated(isAuth === 'true');
    setLoading(false);
  }, []);

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    let start, end;
    
    switch(dateRange) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = now;
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        break;
      case 'last7':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case 'last30':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        end = now;
        break;
      case 'allTime':
        start = new Date(2020, 0, 1);
        end = now;
        break;
      case 'custom':
        start = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1);
        end = customEnd ? new Date(customEnd) : now;
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
    }
    
    return { start, end };
  };

  // Fetch main data
  const fetchData = async () => {
    setLoading(true);
    const { start, end } = getDateRange();
    
    try {
      const res = await fetch(`/api/stripe?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      const result = await res.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  };

  // Fetch customers data
  const fetchCustomers = async () => {
    const { start, end } = getDateRange();
    try {
      const res = await fetch(`/api/customers?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      const result = await res.json();
      setCustomers(result);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  // Fetch churned data
  const fetchChurned = async () => {
    const { start, end } = getDateRange();
    try {
      const res = await fetch(`/api/churned?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      const result = await res.json();
      setChurned(result);
    } catch (err) {
      console.error('Error fetching churned:', err);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchData();
      fetchCustomers();
      fetchChurned();
    }
  }, [authenticated, dateRange, customStart, customEnd]);

  const handleRefresh = () => {
    fetchData();
    fetchCustomers();
    fetchChurned();
  };

  if (loading && !authenticated) {
    return <div className="min-h-screen flex items-center justify-center">Laden...</div>;
  }

  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />;
  }

  const dateRangeOptions = [
    { value: 'today', label: 'Heute' },
    { value: 'yesterday', label: 'Gestern' },
    { value: 'last7', label: 'Letzte 7 Tage' },
    { value: 'last30', label: 'Letzte 30 Tage' },
    { value: 'thisMonth', label: 'Dieser Monat' },
    { value: 'lastMonth', label: 'Letzter Monat' },
    { value: 'thisYear', label: 'Dieses Jahr' },
    { value: 'allTime', label: 'Gesamter Zeitraum' },
    { value: 'custom', label: 'Benutzerdefiniert' },
  ];

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: '📊' },
    { id: 'marton', label: 'marton.ai', icon: '🌐' },
    { id: 'raumblick', label: 'Raumblick360', icon: '🏠' },
    { id: 'customers', label: 'Kunden', icon: '👥' },
    { id: 'churned', label: 'Kündigungen', icon: '📉' },
    { id: 'insights', label: 'Software Insights', icon: '💡' },
  ];

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 50%, #fce4ec 100%)'}}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">Logo</div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Business Dashboard</h1>
                <p className="text-sm text-gray-500">marton.ai & Raumblick360</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Date Range Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Icons.Calendar />
                  <span>{dateRangeOptions.find(o => o.value === dateRange)?.label}</span>
                  <span className="text-gray-400">▼</span>
                </button>
                
                {showDatePicker && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <div className="p-2">
                      {dateRangeOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setDateRange(option.value);
                            if (option.value !== 'custom') setShowDatePicker(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 ${dateRange === option.value ? 'bg-teal-50 text-teal-700' : ''}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {dateRange === 'custom' && (
                      <div className="p-3 border-t">
                        <input
                          type="date"
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                          className="w-full mb-2 px-3 py-2 border rounded-lg"
                        />
                        <input
                          type="date"
                          value={customEnd}
                          onChange={(e) => setCustomEnd(e.target.value)}
                          className="w-full mb-2 px-3 py-2 border rounded-lg"
                        />
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="w-full py-2 bg-teal-600 text-white rounded-lg"
                        >
                          Anwenden
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                <Icons.Refresh />
                Aktualisieren
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Icons.Download />
                Export
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-white/50 hover:bg-white text-gray-600'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {lastUpdated && (
          <p className="text-sm text-gray-500 mb-4">
            Zuletzt aktualisiert: {formatDateTime(lastUpdated.toISOString())}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && data && (
              <OverviewTab data={data} />
            )}

            {/* Marton Tab */}
            {activeTab === 'marton' && data && (
              <MartonTab data={data} />
            )}

            {/* Raumblick Tab */}
            {activeTab === 'raumblick' && data && (
              <RaumblickTab data={data} />
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
              <CustomersTab 
                customers={customers} 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            )}

            {/* Churned Tab */}
            {activeTab === 'churned' && (
              <ChurnedTab 
                churned={churned}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            )}

            {/* Insights Tab */}
            {activeTab === 'insights' && data && (
              <InsightsTab data={data} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// KPI Card Component
function KPICard({ title, value, subtitle, icon, tooltip }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm relative">
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</span>
        <div className="relative">
          {tooltip && (
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ⓘ
            </button>
          )}
          {showTooltip && tooltip && (
            <div className="absolute right-0 top-6 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg z-10">
              {tooltip}
            </div>
          )}
          {icon && <span className="text-2xl text-teal-600">{icon}</span>}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// Overview Tab
function OverviewTab({ data }) {
  const saas = data?.saas || {};
  const agency = data?.agency || {};
  
  const totalRevenue = (saas.totalRevenue || 0) + (agency.totalRevenue || 0);
  const totalMRR = (saas.mrr || 0) + (agency.mrr || 0);
  const adjustedMRR = totalMRR + ((agency.totalRevenue || 0) / 12);
  const arr = totalMRR * 12;
  const expectedARR = adjustedMRR * 12;
  const totalOrders = agency.videoCount || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <KPICard 
        title="Gesamtumsatz (Netto)" 
        value={formatCurrency(totalRevenue)}
        icon="💰"
        tooltip="Summe aller Einnahmen im gewählten Zeitraum"
      />
      <KPICard 
        title="MRR" 
        value={formatCurrency(totalMRR)}
        subtitle="Monthly Recurring Revenue"
        icon="📈"
      />
      <KPICard 
        title="Adjusted MRR" 
        value={formatCurrency(adjustedMRR)}
        subtitle="MRR + Ø Einzelkäufe"
        icon="⚙️"
        tooltip="MRR plus durchschnittliche monatliche Einzelkäufe"
      />
      <KPICard 
        title="ARR" 
        value={formatCurrency(arr)}
        subtitle="Annual Recurring Revenue"
        icon="📊"
      />
      <KPICard 
        title="Erwarteter ARR" 
        value={formatCurrency(expectedARR)}
        subtitle="Aus Adjusted MRR"
        icon="🎯"
      />
      <KPICard 
        title="Agentur Aufträge" 
        value={totalOrders}
        subtitle="Videos im Zeitraum"
        icon="🎬"
      />
    </div>
  );
}

// Marton Tab
function MartonTab({ data }) {
  const saas = data?.saas || {};
  
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">marton.ai - SaaS Metriken</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard title="MRR" value={formatCurrency(saas.mrr || 0)} icon="📈" />
        <KPICard title="Aktive Abos" value={saas.activeSubscriptions || 0} icon="👥" />
        <KPICard title="Neukunden" value={saas.newCustomers || 0} icon="🆕" />
        <KPICard title="Umsatz" value={formatCurrency(saas.totalRevenue || 0)} icon="💰" />
      </div>
      
      {saas.transactions && saas.transactions.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Letzte Transaktionen</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3">Kunde</th>
                  <th className="pb-3">Typ</th>
                  <th className="pb-3">Betrag</th>
                  <th className="pb-3">Datum</th>
                </tr>
              </thead>
              <tbody>
                {saas.transactions.slice(0, 10).map((t, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3">{t.customer || 'Unbekannt'}</td>
                    <td className="py-3">{t.type}</td>
                    <td className="py-3 font-medium">{formatCurrency(t.amount)}</td>
                    <td className="py-3 text-gray-500">{formatDate(t.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Raumblick Tab
function RaumblickTab({ data }) {
  const agency = data?.agency || {};
  
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Raumblick360 - Agentur Metriken</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard title="Umsatz" value={formatCurrency(agency.totalRevenue || 0)} icon="💰" />
        <KPICard title="Videos erstellt" value={agency.videoCount || 0} icon="🎬" />
        <KPICard title="Ø pro Video" value={formatCurrency(agency.avgOrderValue || 0)} icon="📊" />
        <KPICard title="Aufträge" value={agency.orderCount || 0} icon="📝" />
      </div>
    </div>
  );
}

// Insights Tab
function InsightsTab({ data }) {
  const saas = data?.saas || {};
  const agency = data?.agency || {};
  
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Software Insights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Umsatzverteilung</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>marton.ai</span>
                <span>{formatCurrency(saas.totalRevenue || 0)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-teal-500 h-3 rounded-full" 
                  style={{width: `${((saas.totalRevenue || 0) / ((saas.totalRevenue || 0) + (agency.totalRevenue || 1))) * 100}%`}}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Raumblick360</span>
                <span>{formatCurrency(agency.totalRevenue || 0)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full"
                  style={{width: `${((agency.totalRevenue || 0) / ((saas.totalRevenue || 1) + (agency.totalRevenue || 0))) * 100}%`}}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Geschäftsbewertung</h3>
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-teal-600">
              {formatCurrency(((saas.mrr || 0) + ((agency.totalRevenue || 0) / 12)) * 12 * 5)}
            </p>
            <p className="text-gray-500 mt-2">Geschätzter Unternehmenswert</p>
            <p className="text-xs text-gray-400 mt-1">(5x ARR Multiplikator)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// NEW: Customers Tab
function CustomersTab({ customers, searchTerm, setSearchTerm }) {
  if (!customers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const { subscribers, oneTimeBuyers, summary } = customers;
  
  // Filter by search term
  const filteredSubscribers = subscribers?.filter(s => 
    s.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  const filteredOneTime = oneTimeBuyers?.filter(b =>
    b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Kunden Übersicht</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KPICard 
          title="Aktive Abonnenten" 
          value={summary?.totalSubscribers || 0}
          icon="👥"
        />
        <KPICard 
          title="Einzelkäufer" 
          value={summary?.totalOneTime || 0}
          icon="🛒"
        />
        <KPICard 
          title="Gesamt Kunden" 
          value={summary?.totalCustomers || 0}
          icon="📊"
        />
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icons.Search />
          </span>
          <input
            type="text"
            placeholder="Kunden suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Active Subscribers Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-teal-600">●</span>
          Aktive Abonnenten ({filteredSubscribers.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 pr-4">Kunde</th>
                <th className="pb-3 pr-4">E-Mail</th>
                <th className="pb-3 pr-4">Produkt</th>
                <th className="pb-3 pr-4">Plan</th>
                <th className="pb-3 pr-4">Betrag</th>
                <th className="pb-3 pr-4">Seit</th>
                <th className="pb-3">Nächste Zahlung</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Keine Abonnenten gefunden
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub, i) => (
                  <tr key={sub.id || i} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium">{sub.customerName}</td>
                    <td className="py-3 pr-4 text-gray-500 text-sm">{sub.customerEmail}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sub.source === 'marton.ai' 
                          ? 'bg-teal-100 text-teal-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {sub.source}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{sub.plan}</td>
                    <td className="py-3 pr-4 font-medium">
                      {formatCurrency(sub.amount)}/{sub.interval === 'month' ? 'Monat' : 'Jahr'}
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{formatDate(sub.startDate)}</td>
                    <td className="py-3 text-gray-500">{formatDate(sub.currentPeriodEnd)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* One-time Buyers Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-blue-600">●</span>
          Einzelkäufer ({filteredOneTime.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 pr-4">Kunde</th>
                <th className="pb-3 pr-4">E-Mail</th>
                <th className="pb-3 pr-4">Produkt</th>
                <th className="pb-3 pr-4">Beschreibung</th>
                <th className="pb-3 pr-4">Betrag</th>
                <th className="pb-3">Datum</th>
              </tr>
            </thead>
            <tbody>
              {filteredOneTime.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Keine Einzelkäufer gefunden
                  </td>
                </tr>
              ) : (
                filteredOneTime.map((buyer, i) => (
                  <tr key={buyer.id || i} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium">{buyer.customerName}</td>
                    <td className="py-3 pr-4 text-gray-500 text-sm">{buyer.customerEmail}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        buyer.source === 'marton.ai' 
                          ? 'bg-teal-100 text-teal-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {buyer.source}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{buyer.description}</td>
                    <td className="py-3 pr-4 font-medium">{formatCurrency(buyer.amount)}</td>
                    <td className="py-3 text-gray-500">{formatDate(buyer.date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// NEW: Churned Customers Tab
function ChurnedTab({ churned, searchTerm, setSearchTerm }) {
  if (!churned) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const { churnedCustomers, summary } = churned;
  
  // Filter by search term
  const filteredChurned = churnedCustomers?.filter(c => 
    c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Kündigungen & Churn</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <KPICard 
          title="Gekündigte Abos" 
          value={summary?.totalChurned || 0}
          icon="📉"
        />
        <KPICard 
          title="Verlorener MRR" 
          value={formatCurrency(summary?.totalMrrLost || 0)}
          icon="💸"
        />
        <KPICard 
          title="Ø Abo-Dauer" 
          value={`${summary?.avgSubscriptionDays || 0} Tage`}
          icon="📅"
        />
        <KPICard 
          title="Churn Rate" 
          value="—"
          subtitle="Wird berechnet..."
          icon="📊"
        />
      </div>

      {/* Reason Breakdown */}
      {summary?.reasonBreakdown && Object.keys(summary.reasonBreakdown).length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Kündigungsgründe</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(summary.reasonBreakdown).map(([reason, count]) => (
              <div key={reason} className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-gray-800">{count}</p>
                <p className="text-sm text-gray-500">{reasonTranslations[reason] || reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icons.Search />
          </span>
          <input
            type="text"
            placeholder="Gekündigte Kunden suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Churned Customers Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-red-500">●</span>
          Gekündigte Kunden ({filteredChurned.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 pr-4">Kunde</th>
                <th className="pb-3 pr-4">E-Mail</th>
                <th className="pb-3 pr-4">Produkt</th>
                <th className="pb-3 pr-4">Plan</th>
                <th className="pb-3 pr-4">MRR verloren</th>
                <th className="pb-3 pr-4">Abo-Dauer</th>
                <th className="pb-3 pr-4">Gekündigt am</th>
                <th className="pb-3">Grund</th>
              </tr>
            </thead>
            <tbody>
              {filteredChurned.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    Keine Kündigungen gefunden
                  </td>
                </tr>
              ) : (
                filteredChurned.map((customer, i) => (
                  <tr key={customer.id || i} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium">{customer.customerName}</td>
                    <td className="py-3 pr-4 text-gray-500 text-sm">{customer.customerEmail}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        customer.source === 'marton.ai' 
                          ? 'bg-teal-100 text-teal-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {customer.source}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{customer.plan}</td>
                    <td className="py-3 pr-4 font-medium text-red-600">
                      -{formatCurrency(customer.mrr)}
                    </td>
                    <td className="py-3 pr-4 text-gray-500">
                      {customer.durationDays ? `${customer.durationDays} Tage` : '-'}
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{formatDate(customer.canceledAt)}</td>
                    <td className="py-3">
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.cancellationReason 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {reasonTranslations[customer.cancellationReason] || customer.cancellationReason || 'Nicht angegeben'}
                        </span>
                        {customer.cancellationComment && (
                          <p className="text-xs text-gray-400 mt-1 max-w-xs truncate" title={customer.cancellationComment}>
                            "{customer.cancellationComment}"
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
