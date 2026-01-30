import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSaas = new Stripe(process.env.STRIPE_SECRET_KEY_SAAS);
const stripeAgency = new Stripe(process.env.STRIPE_SECRET_KEY_AGENCY);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const startTimestamp = startDate ? Math.floor(new Date(startDate).getTime() / 1000) : null;
    const endTimestamp = endDate ? Math.floor(new Date(endDate).setHours(23, 59, 59, 999) / 1000) : null;

    // Fetch data from both Stripe accounts in parallel
    const [saasData, agencyData] = await Promise.all([
      fetchStripeData(stripeSaas, startTimestamp, endTimestamp, 'saas'),
      fetchStripeData(stripeAgency, startTimestamp, endTimestamp, 'agency')
    ]);

    return NextResponse.json({
      saas: saasData,
      agency: agencyData
    });

  } catch (error) {
    console.error('Error fetching Stripe data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function fetchStripeData(stripe, startTimestamp, endTimestamp, type) {
  try {
    // Fetch subscriptions
    const subscriptions = await stripe.subscriptions.list({ status: 'active', limit: 100 });
    
    // Calculate MRR from active subscriptions
    let mrr = 0;
    subscriptions.data.forEach(sub => {
      const amount = sub.items.data[0]?.price?.unit_amount || 0;
      const interval = sub.items.data[0]?.price?.recurring?.interval;
      if (interval === 'month') {
        mrr += amount / 100;
      } else if (interval === 'year') {
        mrr += (amount / 100) / 12;
      }
    });

    // Fetch charges/payments in date range
    const chargeParams = { limit: 100 };
    if (startTimestamp) chargeParams.created = { gte: startTimestamp };
    if (endTimestamp) chargeParams.created = { ...chargeParams.created, lte: endTimestamp };
    
    const charges = await stripe.charges.list(chargeParams);
    
    // Calculate total revenue
    let totalRevenue = 0;
    let transactions = [];
    
    charges.data.forEach(charge => {
      if (charge.status === 'succeeded') {
        totalRevenue += charge.amount / 100;
        transactions.push({
          id: charge.id,
          customer: charge.billing_details?.name || charge.receipt_email || 'Unbekannt',
          amount: charge.amount / 100,
          type: charge.invoice ? 'Abo' : 'Einzelkauf',
          date: new Date(charge.created * 1000).toISOString(),
          status: charge.status
        });
      }
    });

    // Count new customers (subscriptions created in date range)
    let newCustomers = 0;
    subscriptions.data.forEach(sub => {
      if (startTimestamp && sub.created >= startTimestamp) {
        if (!endTimestamp || sub.created <= endTimestamp) {
          newCustomers++;
        }
      }
    });

    // For agency: count video orders from charges
    const videoCount = type === 'agency' ? charges.data.filter(c => c.status === 'succeeded').length : 0;
    const orderCount = type === 'agency' ? charges.data.filter(c => c.status === 'succeeded' && !c.invoice).length : 0;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    return {
      mrr,
      totalRevenue,
      activeSubscriptions: subscriptions.data.length,
      newCustomers,
      transactions: transactions.slice(0, 20),
      videoCount,
      orderCount,
      avgOrderValue,
      avgBasketMonthly: mrr / Math.max(subscriptions.data.length, 1),
      avgBasketYearly: (mrr * 12) / Math.max(subscriptions.data.length, 1),
      singlePurchaseCount: charges.data.filter(c => c.status === 'succeeded' && !c.invoice).length
    };

  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
    return {
      mrr: 0,
      totalRevenue: 0,
      activeSubscriptions: 0,
      newCustomers: 0,
      transactions: [],
      videoCount: 0,
      orderCount: 0,
      avgOrderValue: 0,
      avgBasketMonthly: 0,
      avgBasketYearly: 0,
      singlePurchaseCount: 0
    };
  }
}
