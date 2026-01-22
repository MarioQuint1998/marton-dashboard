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

    // Fetch active subscriptions from both Stripe accounts
    const [saasSubscriptions, agencySubscriptions] = await Promise.all([
      fetchAllSubscriptions(stripeSaas, 'active'),
      fetchAllSubscriptions(stripeAgency, 'active')
    ]);

    // Fetch one-time payments (successful charges without subscription)
    const [saasCharges, agencyCharges] = await Promise.all([
      fetchOneTimePayments(stripeSaas, startTimestamp, endTimestamp),
      fetchOneTimePayments(stripeAgency, startTimestamp, endTimestamp)
    ]);

    // Process subscriptions
    const subscribers = [];
    
    for (const sub of [...saasSubscriptions, ...agencySubscriptions]) {
      const source = saasSubscriptions.includes(sub) ? 'marton.ai' : 'Raumblick360';
      const customer = await getCustomerDetails(
        saasSubscriptions.includes(sub) ? stripeSaas : stripeAgency, 
        sub.customer
      );
      
      subscribers.push({
        id: sub.id,
        type: 'subscription',
        source,
        customerName: customer.name || customer.email || 'Unbekannt',
        customerEmail: customer.email || '',
        plan: sub.items.data[0]?.price?.nickname || sub.items.data[0]?.price?.product || 'Standard',
        amount: sub.items.data[0]?.price?.unit_amount / 100 || 0,
        currency: sub.currency?.toUpperCase() || 'EUR',
        interval: sub.items.data[0]?.price?.recurring?.interval || 'month',
        status: sub.status,
        startDate: new Date(sub.start_date * 1000).toISOString(),
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
      });
    }

    // Process one-time payments
    const oneTimeBuyers = [];
    
    for (const charge of [...saasCharges, ...agencyCharges]) {
      const source = saasCharges.includes(charge) ? 'marton.ai' : 'Raumblick360';
      
      oneTimeBuyers.push({
        id: charge.id,
        type: 'one_time',
        source,
        customerName: charge.billing_details?.name || charge.customer_email || 'Unbekannt',
        customerEmail: charge.billing_details?.email || charge.receipt_email || '',
        description: charge.description || 'Einzelkauf',
        amount: charge.amount / 100,
        currency: charge.currency?.toUpperCase() || 'EUR',
        status: charge.status,
        date: new Date(charge.created * 1000).toISOString(),
      });
    }

    return NextResponse.json({
      subscribers,
      oneTimeBuyers,
      summary: {
        totalSubscribers: subscribers.length,
        totalOneTime: oneTimeBuyers.length,
        totalCustomers: subscribers.length + oneTimeBuyers.length
      }
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function fetchAllSubscriptions(stripe, status) {
  const subscriptions = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const params = { status, limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;
    
    const response = await stripe.subscriptions.list(params);
    subscriptions.push(...response.data);
    hasMore = response.has_more;
    if (response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }
  
  return subscriptions;
}

async function fetchOneTimePayments(stripe, startTimestamp, endTimestamp) {
  const charges = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const params = { limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;
    if (startTimestamp) params.created = { gte: startTimestamp };
    if (endTimestamp) params.created = { ...params.created, lte: endTimestamp };
    
    const response = await stripe.charges.list(params);
    
    // Filter for successful charges that are not part of a subscription
    const oneTimeCharges = response.data.filter(charge => 
      charge.status === 'succeeded' && 
      !charge.invoice
    );
    
    charges.push(...oneTimeCharges);
    hasMore = response.has_more;
    if (response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }
  
  return charges;
}

async function getCustomerDetails(stripe, customerId) {
  try {
    if (!customerId) return { name: null, email: null };
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch {
    return { name: null, email: null };
  }
}
