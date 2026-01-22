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

    const [saasCanceled, agencyCanceled] = await Promise.all([
      fetchCanceledSubscriptions(stripeSaas, startTimestamp, endTimestamp),
      fetchCanceledSubscriptions(stripeAgency, startTimestamp, endTimestamp)
    ]);

    const churnedCustomers = [];
    
    for (const sub of [...saasCanceled, ...agencyCanceled]) {
      const source = saasCanceled.includes(sub) ? 'marton.ai' : 'Raumblick360';
      const stripe = saasCanceled.includes(sub) ? stripeSaas : stripeAgency;
      const customer = await getCustomerDetails(stripe, sub.customer);
      
      churnedCustomers.push({
        id: sub.id,
        source,
        customerName: customer.name || customer.email || 'Unbekannt',
        customerEmail: customer.email || '',
        plan: sub.items?.data[0]?.price?.nickname || sub.plan?.nickname || 'Standard',
        amount: (sub.items?.data[0]?.price?.unit_amount || sub.plan?.amount || 0) / 100,
        currency: sub.currency?.toUpperCase() || 'EUR',
        interval: sub.items?.data[0]?.price?.recurring?.interval || sub.plan?.interval || 'month',
        status: sub.status,
        startDate: new Date(sub.start_date * 1000).toISOString(),
        canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
        endedAt: sub.ended_at ? new Date(sub.ended_at * 1000).toISOString() : null,
        cancellationReason: sub.cancellation_details?.reason || null,
        cancellationComment: sub.cancellation_details?.comment || null,
        durationDays: sub.canceled_at && sub.start_date ? Math.round((sub.canceled_at - sub.start_date) / 86400) : null,
        mrr: (sub.items?.data[0]?.price?.unit_amount || sub.plan?.amount || 0) / 100,
      });
    }

    churnedCustomers.sort((a, b) => {
      const dateA = a.canceledAt ? new Date(a.canceledAt) : new Date(0);
      const dateB = b.canceledAt ? new Date(b.canceledAt) : new Date(0);
      return dateB - dateA;
    });

    const totalMrrLost = churnedCustomers.reduce((sum, c) => sum + (c.mrr || 0), 0);
    const avgDuration = churnedCustomers.length > 0 ? Math.round(churnedCustomers.reduce((sum, c) => sum + (c.durationDays || 0), 0) / churnedCustomers.length) : 0;

    const reasonBreakdown = {};
    churnedCustomers.forEach(c => {
      const reason = c.cancellationReason || 'Nicht angegeben';
      reasonBreakdown[reason] = (reasonBreakdown[reason] || 0) + 1;
    });

    return NextResponse.json({
      churnedCustomers,
      summary: { totalChurned: churnedCustomers.length, totalMrrLost, avgSubscriptionDays: avgDuration, reasonBreakdown }
    });
  } catch (error) {
    console.error('Error fetching churned customers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function fetchCanceledSubscriptions(stripe, startTimestamp, endTimestamp) {
  const subscriptions = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const params = { status: 'canceled', limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;
    
    const response = await stripe.subscriptions.list(params);
    let filtered = response.data;
    if (startTimestamp || endTimestamp) {
      filtered = response.data.filter(sub => {
        const cancelDate = sub.canceled_at || sub.ended_at;
        if (!cancelDate) return false;
        if (startTimestamp && cancelDate < startTimestamp) return false;
        if (endTimestamp && cancelDate > endTimestamp) return false;
        return true;
      });
    }
    subscriptions.push(...filtered);
    hasMore = response.has_more;
    if (response.data.length > 0) startingAfter = response.data[response.data.length - 1].id;
    if (startTimestamp && response.data.length > 0) {
      const oldestCancelDate = Math.min(...response.data.map(s => s.canceled_at || s.ended_at || Infinity));
      if (oldestCancelDate < startTimestamp) break;
    }
  }
  return subscriptions;
}

async function getCustomerDetails(stripe, customerId) {
  try {
    if (!customerId) return { name: null, email: null };
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch { return { name: null, email: null }; }
}
