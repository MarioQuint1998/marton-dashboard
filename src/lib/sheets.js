import Papa from 'papaparse';

// Fetch and parse Google Sheets data
export async function fetchGoogleSheetsData(startDate, endDate) {
  try {
    const sheetUrl = process.env.GOOGLE_SHEET_URL || 
      'https://docs.google.com/spreadsheets/d/1RxzVEVXy5kdiCgGrWYa1Qe97qFXENjX11iguh7UshjU/export?format=csv';

    const response = await fetch(sheetUrl);
    const csvText = await response.text();

    // Parse CSV
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
    });

    const rows = parsed.data;

    // Filter by date range and transform
    const filteredData = rows
      .map(row => {
        // Parse date (assuming format DD.MM.YYYY or YYYY-MM-DD)
        let date;
        const dateStr = row.date || row.datum;
        if (dateStr) {
          if (dateStr.includes('.')) {
            const [day, month, year] = dateStr.split('.');
            date = new Date(year, month - 1, day);
          } else {
            date = new Date(dateStr);
          }
        }

        // Parse amount
        const amountStr = row.amount || row.betrag || '0';
        const amount = parseFloat(amountStr.replace(',', '.').replace('€', '').trim()) || 0;

        // Parse MRR contribution
        const mrrStr = row.mrr || '0';
        const mrr = parseFloat(mrrStr.replace(',', '.').replace('€', '').trim()) || 0;

        // Parse credits/videos
        const credits = parseInt(row.credits || row.videos || '0', 10) || 0;

        // Parse price per video
        const pricePerVideoStr = row.preis_per_video || row.price_per_video || '0';
        const pricePerVideo = parseFloat(pricePerVideoStr.replace(',', '.').replace('€', '').trim()) || 0;

        return {
          date,
          customer: row.customer || row.kunde || '',
          amount, // This is net amount
          type: (row.type || row.typ || '').toLowerCase(),
          credits,
          pricePerVideo,
          mrr,
        };
      })
      .filter(row => {
        if (!row.date || isNaN(row.date.getTime())) return false;
        return row.date >= startDate && row.date <= endDate;
      });

    // Categorize by type
    const monthlyDeals = filteredData.filter(d => d.type.includes('month') || d.type.includes('monat'));
    const yearlyDeals = filteredData.filter(d => d.type.includes('year') || d.type.includes('jahr'));
    const singleDeals = filteredData.filter(d => 
      d.type.includes('single') || d.type.includes('einzel') || d.type.includes('einmal')
    );

    // Calculate totals
    const totalRevenue = filteredData.reduce((sum, d) => sum + d.amount, 0);
    const totalMRR = filteredData.reduce((sum, d) => sum + d.mrr, 0);
    const totalCredits = filteredData.reduce((sum, d) => sum + d.credits, 0);

    // Count active manual subscribers (those with MRR > 0)
    const activeManualSubscribers = filteredData.filter(d => d.mrr > 0).length;

    // Monthly breakdown
    const monthlyBreakdown = {};
    for (const deal of filteredData) {
      const monthKey = `${deal.date.getFullYear()}-${String(deal.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = {
          month: monthKey,
          revenue: 0,
          mrr: 0,
          deals: 0,
        };
      }
      monthlyBreakdown[monthKey].revenue += deal.amount;
      monthlyBreakdown[monthKey].mrr += deal.mrr;
      monthlyBreakdown[monthKey].deals += 1;
    }

    return {
      totalRevenue,
      totalMRR,
      totalCredits,
      activeManualSubscribers,
      dealCount: filteredData.length,
      monthlyDeals: monthlyDeals.length,
      yearlyDeals: yearlyDeals.length,
      singleDeals: singleDeals.length,
      monthlyBreakdown: Object.values(monthlyBreakdown).sort((a, b) => a.month.localeCompare(b.month)),
      rawData: filteredData,
    };
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    return {
      totalRevenue: 0,
      totalMRR: 0,
      totalCredits: 0,
      activeManualSubscribers: 0,
      dealCount: 0,
      monthlyDeals: 0,
      yearlyDeals: 0,
      singleDeals: 0,
      monthlyBreakdown: [],
      rawData: [],
    };
  }
}
