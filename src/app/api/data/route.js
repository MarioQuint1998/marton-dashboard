import { NextResponse } from 'next/server';
import { fetchSaaSData, fetchAgencyData, getCustomerData } from '@/lib/stripe';
import { fetchGoogleSheetsData } from '@/lib/sheets';
import { fetchFirebaseUserData } from '@/lib/firebase';

export async function POST(request) {
  try {
    const { startDate, endDate } = await request.json();
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    // Fetch all data in parallel
    const [saasData, agencyData, sheetsData, userData, customerData] = await Promise.all([
      fetchSaaSData(start, end),
      fetchAgencyData(start, end),
      fetchGoogleSheetsData(start, end),
      fetchFirebaseUserData(start, end),
      getCustomerData(),
    ]);

    // Combine MRR from Stripe and Google Sheets
    const combinedMRR = saasData.mrr + sheetsData.totalMRR;
    
    // Calculate Adjusted MRR (MRR + average monthly single purchases)
    // Using the single purchase revenue divided by months in range
    const monthsInRange = Math.max(1, Math.ceil((end - start) / (30 * 24 * 60 * 60 * 1000)));
    const avgMonthlySingles = saasData.singleRevenue / monthsInRange;
    const adjustedMRR = combinedMRR + avgMonthlySingles;

    // Combined ARR
    const combinedARR = combinedMRR * 12;
    const expectedARR = adjustedMRR * 12;

    // Total revenue (SaaS + Agency + Sheets)
    const totalRevenue = saasData.totalRevenue + agencyData.totalRevenue + sheetsData.totalRevenue;

    // Company valuations
    const valuations = {
      '3x': expectedARR * 3,
      '5x': expectedARR * 5,
      '8x': expectedARR * 8,
    };

    // Active subscribers (Stripe + Sheets manual)
    const totalActiveSubscribers = saasData.activeSubscribers + sheetsData.activeManualSubscribers;

    // Merge monthly breakdowns for combined chart
    const combinedMonthlyBreakdown = mergeBreakdowns(
      saasData.monthlyBreakdown,
      agencyData.monthlyBreakdown,
      sheetsData.monthlyBreakdown
    );

    // Calculate ARPU using customer data
    const arpu = userData.totalUserbase > 0 
      ? totalRevenue / userData.totalUserbase 
      : 0;

    // Calculate CLV
    const clv = customerData.clv;

    return NextResponse.json({
      success: true,
      data: {
        // Overview metrics
        overview: {
          totalRevenue,
          mrr: combinedMRR,
          adjustedMRR,
          arr: combinedARR,
          expectedARR,
          valuations,
          totalOrders: agencyData.orderCount + saasData.singlePurchaseCount,
        },
        
        // SaaS metrics
        saas: {
          revenue: saasData.totalRevenue + sheetsData.totalRevenue,
          mrr: combinedMRR,
          monthlyMRR: saasData.monthlyMRR,
          yearlyMRR: saasData.yearlyMRR,
          sheetsMRR: sheetsData.totalMRR,
          arr: combinedARR,
          activeSubscribers: totalActiveSubscribers,
          monthlySubscribers: saasData.monthlySubscribers,
          yearlySubscribers: saasData.yearlySubscribers,
          singlePurchaseCount: saasData.singlePurchaseCount,
          singleRevenue: saasData.singleRevenue,
          monthlyRevenue: saasData.monthlyRevenue,
          yearlyRevenue: saasData.yearlyRevenue,
          avgBasketMonthly: saasData.avgBasketMonthly,
          avgBasketYearly: saasData.avgBasketYearly,
          avgBasketSingle: saasData.avgBasketSingle,
          churnRate: saasData.churnRate,
          churnCount: saasData.churnCount,
          newSubscriptions: saasData.newSubscriptions,
          monthlyBreakdown: saasData.monthlyBreakdown,
          mrrHistory: saasData.mrrHistory,
          inflowOutflow: saasData.inflowOutflow,
        },
        
        // Agency metrics
        agency: {
          revenue: agencyData.totalRevenue,
          orderCount: agencyData.orderCount,
          avgBasket: agencyData.avgBasket,
          stripeRevenue: agencyData.totalRevenue,
          sevdeskRevenue: agencyData.sevdeskRevenue,
          sevdeskOrderCount: agencyData.sevdeskOrderCount,
          sevdeskAvgBasket: agencyData.sevdeskAvgBasket,
          monthlyBreakdown: agencyData.monthlyBreakdown,
        },
        
        // Software insights
        insights: {
          totalUserbase: userData.totalUserbase,
          activeSubscribers: totalActiveSubscribers,
          conversionFreeToSub: userData.conversionFreeToSub,
          conversionFreeToPaying: userData.conversionFreeToPaying,
          avgDiscountMonthly: saasData.avgDiscountMonthly,
          avgDiscountYearly: saasData.avgDiscountYearly,
          avgDiscountSingle: saasData.avgDiscountSingle,
          avgUsagePercent: userData.avgUsagePercent,
          singleBuyersCount: saasData.singlePurchaseCount,
          clv,
          arpu,
          avgTimeToFirstPurchase: userData.avgTimeToFirstPurchase,
        },
        
        // Combined monthly breakdown for overview chart
        combinedMonthlyBreakdown,
        
        // Google Sheets data
        sheetsData: {
          totalRevenue: sheetsData.totalRevenue,
          totalMRR: sheetsData.totalMRR,
          dealCount: sheetsData.dealCount,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

// Helper to merge monthly breakdowns
function mergeBreakdowns(...breakdowns) {
  const merged = {};
  
  for (const breakdown of breakdowns) {
    if (!breakdown || !Array.isArray(breakdown)) continue;
    
    for (const item of breakdown) {
      const monthKey = item.month;
      if (!merged[monthKey]) {
        merged[monthKey] = {
          month: monthKey,
          saasYearly: 0,
          saasMonthly: 0,
          saasSingle: 0,
          agencyStripe: 0,
          agencySevdesk: 0,
          sheetsManual: 0,
          total: 0,
        };
      }
      
      // Map fields from different sources
      if (item.yearly !== undefined) merged[monthKey].saasYearly += item.yearly || 0;
      if (item.monthly !== undefined) merged[monthKey].saasMonthly += item.monthly || 0;
      if (item.single !== undefined) merged[monthKey].saasSingle += item.single || 0;
      if (item.stripeRevenue !== undefined) merged[monthKey].agencyStripe += item.stripeRevenue || 0;
      if (item.sevdeskRevenue !== undefined) merged[monthKey].agencySevdesk += item.sevdeskRevenue || 0;
      if (item.revenue !== undefined && !item.yearly && !item.stripeRevenue) {
        merged[monthKey].sheetsManual += item.revenue || 0;
      }
    }
  }
  
  // Calculate totals
  for (const month of Object.values(merged)) {
    month.total = month.saasYearly + month.saasMonthly + month.saasSingle + 
                  month.agencyStripe + month.agencySevdesk + month.sheetsManual;
  }
  
  return Object.values(merged).sort((a, b) => a.month.localeCompare(b.month));
}
