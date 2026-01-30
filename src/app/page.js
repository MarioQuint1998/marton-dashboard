'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Download, TrendingUp, Users, CreditCard, Target, Percent, Clock, ShoppingCart, UserCheck, Activity, Search } from 'lucide-react';
import LoginScreen from '@/components/LoginScreen';
import Navigation from '@/components/Navigation';
import DatePicker from '@/components/DatePicker';
import MetricCard, { MetricCardCompact, ValuationCard } from '@/components/MetricCard';
import { 
  RevenueBreakdownChart, 
  MRRChart, 
  InflowOutflowChart, 
  AgencyRevenueChart,
  SaaSRevenueChart 
} from '@/components/Charts';
import { formatCurrency, formatNumber, formatPercent, getDatePresets } from '@/lib/utils';

export default function Dashboard() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Dashboard state
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // New states for customers and churned
  const [customers, setCustomers] = useState(null);
  const [churned, setChurned] = useState(null);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [churnedLoading, setChurnedLoading] = useState(false);

  // Date range
  const presets = getDatePresets();
  const [startDate, setStartDate] = useState(presets.thisMonth.start);
  const [endDate, setEndDate] = useState(presets.thisMonth.end);

  // Check existing auth on mount
  useEffect(() => {
    const auth = sessionStorage.getItem('dashboard_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setCheckingAuth(false);
  }, []);

  // Fetch main data function
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date());
      } else {
        setError(result.error || 'Fehler beim Laden der Daten');
      }
    } catch (err) {
      setError('Verbindungsfehler. Bitte erneut versuchen.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Fetch customers data
  const fetchCustomers = useCallback(async () => {
    setCustomersLoading(true);
    try {
      const response = await fetch(`/api/customers?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      const result = await response.json();
      if (!result.error) {
        setCustomers(result);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setCustomersLoading(false);
    }
  }, [startDate, endDate]);

  // Fetch churned data
  const fetchChurned = useCallback(async () => {
    setChurnedLoading(true);
    try {
      const response = await fetch(`/api/churned?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      const result = await response.json();
      if (!result.error) {
        setChurned(result);
      }
    } catch (err) {
      console.error('Error fetching churned:', err);
    } finally {
      setChurnedLoading(false);
    }
  }, [startDate, endDate]);

  // Fetch data on mount and when date range changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      fetchCustomers();
      fetchChurned();
    }
  }, [isAuthenticated, fetchData, fetchCustomers, fetchChurned]);

  // Handle date change
  const handleDateChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchData();
    fetchCustomers();
    fetchChurned();
  };

  // Export to CSV
  const handleExport = () => {
    if (!data) return;

    const csvContent = generateCSV(data, activeTab, customers, churned);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard_export_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Show loading screen while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <img 
                src="https://storage.googleapis.com/aistudio-community-public/marton-logo-teal.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-xl font-display font-bold text-gray-900">Business Dashboard</h1>
                <p className="text-xs text-gray-500">marton.ai & Raumblick360</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <DatePicker 
                startDate={startDate} 
                endDate={endDate} 
                onChange={handleDateChange} 
              />
              
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Aktualisieren
              </button>

              <button
                onClick={handleExport}
                disabled={!data}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-4">
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
            {error}
          </div>
        )}

        {lastUpdated && (
          <p className="text-sm text-gray-400 mb-6">
            Zuletzt aktualisiert: {lastUpdated.toLocaleString('de-DE')}
          </p>
        )}

        {/* Tab content */}
        {activeTab === 'overview' && <OverviewTab data={data} loading={loading} />}
        {activeTab === 'saas' && <SaaSTab data={data} loading={loading} />}
        {activeTab === 'agency' && <AgencyTab data={data} loading={loading} />}
        {activeTab === 'customers' && <CustomersTab customers={customers} loading={customersLoading} />}
        {activeTab === 'churned' && <ChurnedTab churned={churned} loading={churnedLoading} />}
        {activeTab === 'insights' && <InsightsTab data={data} loading={loading} />}
      </main>
    </div>
  );
}

// Overview Tab
function OverviewTab({ data, loading }) {
  const overview = data?.overview || {};
  const saas = data?.saas || {};
  const agency = data?.agency || {};

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Gesamtumsatz (netto)"
          value={overview.totalRevenue || 0}
          format="currency"
          icon={CreditCard}
          loading={loading}
        />
        <MetricCard
          label="MRR"
          value={saas.mrr || 0}
          format="currency"
          subtitle="Monthly Recurring Revenue"
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          label="Adjusted MRR"
          value={overview.adjustedMRR || 0}
          format="currency"
          subtitle="MRR + Ø Einzelkäufe"
          icon={Target}
          loading={loading}
        />
        <MetricCard
          label="ARR"
          value={saas.arr || 0}
          format="currency"
          subtitle="Annual Recurring Revenue"
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          label="Erwarteter ARR"
          value={overview.expectedARR || 0}
          format="currency"
          subtitle="Aus Adjusted MRR"
          loading={loading}
        />
        <MetricCard
          label="Agentur Aufträge"
          value={agency.orderCount || 0}
          format="number"
          subtitle="Videos im Zeitraum"
          icon={Activity}
          loading={loading}
        />
        <ValuationCard arr={overview.expectedARR || 0} loading={loading} />
      </div>

      {/* Revenue chart */}
      <RevenueBreakdownChart 
        data={data?.combinedMonthlyBreakdown || []} 
        loading={loading} 
      />
    </div>
  );
}

// SaaS Tab
function SaaSTab({ data, loading }) {
  const saas = data?.saas || {};

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="SaaS Umsatz (netto)"
          value={saas.revenue || 0}
          format="currency"
          icon={CreditCard}
          loading={loading}
        />
        <MetricCard
          label="MRR"
          value={saas.mrr || 0}
          format="currency"
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          label="Aktive Abonnenten"
          value={saas.activeSubscribers || 0}
          format="number"
          icon={Users}
          loading={loading}
        />
        <MetricCard
          label="Einzelkäufe"
          value={saas.singlePurchaseCount || 0}
          format="number"
          subtitle={`${formatCurrency(saas.singleRevenue || 0)} Umsatz`}
          icon={ShoppingCart}
          loading={loading}
        />
      </div>

      {/* Average basket values */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Durchschnittlicher Warenkorb</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCardCompact
            label="Monatsabos"
            value={saas.avgBasketMonthly || 0}
            format="currency"
            loading={loading}
          />
          <MetricCardCompact
            label="Jahresabos"
            value={saas.avgBasketYearly || 0}
            format="currency"
            loading={loading}
          />
          <MetricCardCompact
            label="Einzelkäufe"
            value={saas.avgBasketSingle || 0}
            format="currency"
            loading={loading}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InflowOutflowChart data={saas.inflowOutflow || []} loading={loading} />
        <MRRChart data={saas.mrrHistory || []} loading={loading} />
      </div>

      {/* SaaS Revenue breakdown */}
      <SaaSRevenueChart data={saas.monthlyBreakdown || []} loading={loading} />
    </div>
  );
}

// Agency Tab
function AgencyTab({ data, loading }) {
  const agency = data?.agency || {};

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Agentur Umsatz (netto)"
          value={agency.revenue || 0}
          format="currency"
          icon={CreditCard}
          loading={loading}
        />
        <MetricCard
          label="Anzahl Aufträge"
          value={agency.orderCount || 0}
          format="number"
          subtitle="Videos"
          icon={Activity}
          loading={loading}
        />
        <MetricCard
          label="Ø Warenkorb (Stripe)"
          value={agency.avgBasket || 0}
          format="currency"
          subtitle="Einzelvideos"
          icon={ShoppingCart}
          loading={loading}
        />
        <MetricCard
          label="Ø Warenkorb (Sevdesk)"
          value={agency.sevdeskAvgBasket || 0}
          format="currency"
          subtitle="Videopakete"
          icon={ShoppingCart}
          loading={loading}
        />
      </div>

      {/* Revenue breakdown */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Umsatz nach Quelle</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCardCompact
            label="Stripe (Einzelvideos)"
            value={agency.stripeRevenue || 0}
            format="currency"
            loading={loading}
          />
          <MetricCardCompact
            label="Sevdesk (Videopakete)"
            value={agency.sevdeskRevenue || 0}
            format="currency"
            loading={loading}
          />
        </div>
      </div>

      {/* Chart */}
      <AgencyRevenueChart data={agency.monthlyBreakdown || []} loading={loading} />
    </div>
  );
}

// NEW: Customers Tab
function CustomersTab({ customers, loading }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const { subscribers = [], oneTimeBuyers = [], summary = {} } = customers || {};

  // Filter by search term
  const filteredSubscribers = subscribers.filter(s =>
    s.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOneTime = oneTimeBuyers.filter(b =>
    b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          label="Aktive Abonnenten"
          value={summary.totalSubscribers || 0}
          format="number"
          icon={Users}
          loading={loading}
        />
        <MetricCard
          label="Einzelkäufer"
          value={summary.totalOneTime || 0}
          format="number"
          icon={ShoppingCart}
          loading={loading}
        />
        <MetricCard
          label="Gesamt Kunden"
          value={summary.totalCustomers || 0}
          format="number"
          icon={UserCheck}
          loading={loading}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Kunden suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Active Subscribers Table */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          Aktive Abonnenten ({filteredSubscribers.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 pr-4 font-medium">Kunde</th>
                <th className="pb-3 pr-4 font-medium">E-Mail</th>
                <th className="pb-3 pr-4 font-medium">Produkt</th>
                <th className="pb-3 pr-4 font-medium">Plan</th>
                <th className="pb-3 pr-4 font-medium">Betrag</th>
                <th className="pb-3 pr-4 font-medium">Seit</th>
                <th className="pb-3 font-medium">Nächste Zahlung</th>
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
                    <td className="py-4 pr-4 font-medium text-gray-900">{sub.customerName}</td>
                    <td className="py-4 pr-4 text-gray-500 text-sm">{sub.customerEmail}</td>
                    <td className="py-4 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sub.source === 'marton.ai'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {sub.source}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-gray-700">{sub.plan}</td>
                    <td className="py-4 pr-4 font-medium text-gray-900">
                      {formatCurrency(sub.amount)}/{sub.interval === 'month' ? 'Monat' : 'Jahr'}
                    </td>
                    <td className="py-4 pr-4 text-gray-500">{formatDate(sub.startDate)}</td>
                    <td className="py-4 text-gray-500">{formatDate(sub.currentPeriodEnd)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* One-time Buyers Table */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
          Einzelkäufer ({filteredOneTime.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 pr-4 font-medium">Kunde</th>
                <th className="pb-3 pr-4 font-medium">E-Mail</th>
                <th className="pb-3 pr-4 font-medium">Produkt</th>
                <th className="pb-3 pr-4 font-medium">Beschreibung</th>
                <th className="pb-3 pr-4 font-medium">Betrag</th>
                <th className="pb-3 font-medium">Datum</th>
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
                    <td className="py-4 pr-4 font-medium text-gray-900">{buyer.customerName}</td>
                    <td className="py-4 pr-4 text-gray-500 text-sm">{buyer.customerEmail}</td>
                    <td className="py-4 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        buyer.source === 'marton.ai'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {buyer.source}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-gray-700">{buyer.description}</td>
                    <td className="py-4 pr-4 font-medium text-gray-900">{formatCurrency(buyer.amount)}</td>
                    <td className="py-4 text-gray-500">{formatDate(buyer.date)}</td>
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
function ChurnedTab({ churned, loading }) {
  const [searchTerm, setSearchTerm] = useState('');

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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const { churnedCustomers = [], summary = {} } = churned || {};

  // Filter by search term
  const filteredChurned = churnedCustomers.filter(c =>
    c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          label="Gekündigte Abos"
          value={summary.totalChurned || 0}
          format="number"
          icon={Users}
          loading={loading}
        />
        <MetricCard
          label="Verlorener MRR"
          value={summary.totalMrrLost || 0}
          format="currency"
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          label="Ø Abo-Dauer"
          value={summary.avgSubscriptionDays || 0}
          format="days"
          icon={Clock}
          loading={loading}
        />
        <MetricCard
          label="Churn Rate"
          value={0}
          format="percent"
          subtitle="Wird berechnet..."
          icon={Percent}
          loading={loading}
        />
      </div>

      {/* Reason Breakdown */}
      {summary.reasonBreakdown && Object.keys(summary.reasonBreakdown).length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kündigungsgründe</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(summary.reasonBreakdown).map(([reason, count]) => (
              <div key={reason} className="bg-gray-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-500">{reasonTranslations[reason] || reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Gekündigte Kunden suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Churned Customers Table */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
          Gekündigte Kunden ({filteredChurned.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 pr-4 font-medium">Kunde</th>
                <th className="pb-3 pr-4 font-medium">E-Mail</th>
                <th className="pb-3 pr-4 font-medium">Produkt</th>
                <th className="pb-3 pr-4 font-medium">Plan</th>
                <th className="pb-3 pr-4 font-medium">MRR verloren</th>
                <th className="pb-3 pr-4 font-medium">Abo-Dauer</th>
                <th className="pb-3 pr-4 font-medium">Gekündigt am</th>
                <th className="pb-3 font-medium">Grund</th>
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
                    <td className="py-4 pr-4 font-medium text-gray-900">{customer.customerName}</td>
                    <td className="py-4 pr-4 text-gray-500 text-sm">{customer.customerEmail}</td>
                    <td className="py-4 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        customer.source === 'marton.ai'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {customer.source}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-gray-700">{customer.plan}</td>
                    <td className="py-4 pr-4 font-medium text-red-600">
                      -{formatCurrency(customer.mrr)}
                    </td>
                    <td className="py-4 pr-4 text-gray-500">
                      {customer.durationDays ? `${customer.durationDays} Tage` : '-'}
                    </td>
                    <td className="py-4 pr-4 text-gray-500">{formatDate(customer.canceledAt)}</td>
                    <td className="py-4">
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

// Insights Tab
function InsightsTab({ data, loading }) {
  const insights = data?.insights || {};
  const saas = data?.saas || {};

  return (
    <div className="space-y-8 animate-fade-in">
      {/* User metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Total Userbase"
          value={insights.totalUserbase || 0}
          format="number"
          icon={Users}
          loading={loading}
        />
        <MetricCard
          label="Aktive Abonnenten"
          value={insights.activeSubscribers || 0}
          format="number"
          icon={UserCheck}
          loading={loading}
        />
        <MetricCard
          label="Conversion (Free → Sub)"
          value={insights.conversionFreeToSub || 0}
          format="percent"
          icon={Target}
          loading={loading}
        />
        <MetricCard
          label="Conversion (Free → Paying)"
          value={insights.conversionFreeToPaying || 0}
          format="percent"
          subtitle="Inkl. Einzelkäufe"
          icon={Target}
          loading={loading}
        />
      </div>

      {/* Discount & Performance Insights */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rabatt & Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCardCompact
            label="Ø Rabatt Monatsabos"
            value={insights.avgDiscountMonthly || 0}
            format="percent"
            loading={loading}
          />
          <MetricCardCompact
            label="Ø Rabatt Jahresabos"
            value={insights.avgDiscountYearly || 0}
            format="percent"
            loading={loading}
          />
          <MetricCardCompact
            label="Ø Rabatt Einzelkäufe"
            value={insights.avgDiscountSingle || 0}
            format="percent"
            loading={loading}
          />
        </div>
      </div>

      {/* Usage & CLV */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Ø Video-Nutzung"
          value={insights.avgUsagePercent || 0}
          format="percent"
          subtitle="Von Abonnenten"
          icon={Percent}
          loading={loading}
        />
        <MetricCard
          label="Single Buyers"
          value={insights.singleBuyersCount || 0}
          format="number"
          subtitle="Im Zeitraum"
          icon={ShoppingCart}
          loading={loading}
        />
        <MetricCard
          label="CLV"
          value={insights.clv || 0}
          format="currency"
          subtitle="Customer Lifetime Value"
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          label="ARPU"
          value={insights.arpu || 0}
          format="currency"
          subtitle="Avg Revenue per User"
          icon={Users}
          loading={loading}
        />
      </div>

      {/* Time to first purchase */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCardCompact
            label="Ø Zeit bis Erstkauf"
            value={insights.avgTimeToFirstPurchase || 0}
            format="days"
            loading={loading}
          />
          <MetricCardCompact
            label="Churn Rate"
            value={saas.churnRate || 0}
            format="percent"
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Helper function to generate CSV
function generateCSV(data, tab, customers, churned) {
  let rows = [];
  let headers = [];

  switch (tab) {
    case 'overview':
      headers = ['Metrik', 'Wert'];
      rows = [
        ['Gesamtumsatz', data?.overview?.totalRevenue],
        ['MRR', data?.saas?.mrr],
        ['Adjusted MRR', data?.overview?.adjustedMRR],
        ['ARR', data?.saas?.arr],
        ['Erwarteter ARR', data?.overview?.expectedARR],
        ['Agentur Aufträge', data?.agency?.orderCount],
      ];
      break;
    case 'saas':
      headers = ['Metrik', 'Wert'];
      rows = [
        ['SaaS Umsatz', data?.saas?.revenue],
        ['MRR', data?.saas?.mrr],
        ['Aktive Abonnenten', data?.saas?.activeSubscribers],
        ['Einzelkäufe', data?.saas?.singlePurchaseCount],
        ['Ø Warenkorb Monatsabo', data?.saas?.avgBasketMonthly],
        ['Ø Warenkorb Jahresabo', data?.saas?.avgBasketYearly],
        ['Ø Warenkorb Einzelkauf', data?.saas?.avgBasketSingle],
      ];
      break;
    case 'agency':
      headers = ['Metrik', 'Wert'];
      rows = [
        ['Agentur Umsatz', data?.agency?.revenue],
        ['Anzahl Aufträge', data?.agency?.orderCount],
        ['Ø Warenkorb', data?.agency?.avgBasket],
      ];
      break;
    case 'customers':
      headers = ['Name', 'E-Mail', 'Produkt', 'Plan', 'Betrag', 'Seit'];
      rows = (customers?.subscribers || []).map(s => [
        s.customerName,
        s.customerEmail,
        s.source,
        s.plan,
        s.amount,
        s.startDate
      ]);
      break;
    case 'churned':
      headers = ['Name', 'E-Mail', 'Produkt', 'MRR verloren', 'Abo-Dauer', 'Gekündigt am', 'Grund'];
      rows = (churned?.churnedCustomers || []).map(c => [
        c.customerName,
        c.customerEmail,
        c.source,
        c.mrr,
        c.durationDays,
        c.canceledAt,
        c.cancellationReason
      ]);
      break;
    case 'insights':
      headers = ['Metrik', 'Wert'];
      rows = [
        ['Total Userbase', data?.insights?.totalUserbase],
        ['Aktive Abonnenten', data?.insights?.activeSubscribers],
        ['Conversion Free to Sub', data?.insights?.conversionFreeToSub],
        ['Conversion Free to Paying', data?.insights?.conversionFreeToPaying],
        ['CLV', data?.insights?.clv],
        ['ARPU', data?.insights?.arpu],
      ];
      break;
  }

  const csvRows = [headers.join(',')];
  rows.forEach(row => {
    csvRows.push(row.map(val => typeof val === 'number' ? val.toFixed(2) : val).join(','));
  });

  return csvRows.join('\n');
}
