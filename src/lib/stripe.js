import Stripe from 'stripe';

// Initialize Stripe clients
const stripeSaaS = new Stripe(process.env.STRIPE_SECRET_KEY_SAAS, {
  apiVersion: '2024-06-20',
});

const stripeAgency = new Stripe(process.env.STRIPE_SECRET_KEY_AGENCY, {
  apiVersion: '2024-06-20',
});

// Helper to calculate net from gross (19% VAT)
export function calculateNet(grossAmount) {
  return grossAmount / 1.19;
}

// Helper to convert Stripe amount (cents) to euros
export function centsToEuros(cents) {
  return cents / 100;
}

// Get all charges within a date range
async function getCharges(stripeClient, startDate, endDate) {
  const charges = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const params = {
      limit: 100,
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
    };
    if (startingAfter) params.starting_after = startingAfter;

    const response = await stripeClient.charges.list(params);
    charges.push(...response.data.filter(c => c.paid && !c.refunded));
    
    hasMore = response.has_more;
    if (response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  return charges;
}

// Get all subscriptions
async function getAllSubscriptions(stripeClient) {
  const subscriptions = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const params = { limit: 100, status: 'all' };
    if (startingAfter) params.starting_after = startingAfter;

    const response = await stripeClient.subscriptions.list(params);
    subscriptions.push(...response.data);
    
    hasMore = response.has_more;
    if (response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  return subscriptions;
}

// Get active subscriptions
async function getActiveSubscriptions(stripeClient) {
  const subscriptions = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const params = { limit: 100, status: 'active' };
    if (startingAfter) params.starting_after = startingAfter;

    const response = await stripeClient.subscriptions.list(params);
    subscriptions.push(...response.data);
    
    hasMore = response.has_more;
    if (response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  // Also get trialing subscriptions
  hasMore = true;
  startingAfter = null;

  while (hasMore) {
    const params = { limit: 100, status: 'trialing' };
    if (startingAfter) params.starting_after = startingAfter;

    const response = await stripeClient.subscriptions.list(params);
    subscriptions.push(...response.data);
    
    hasMore = response.has_more;
    if (response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  return subscriptions;
}

// Get checkout sessions to identify single purchases
async function getCheckoutSessions(stripeClient, startDate, endDate) {
  const sessions = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const params = {
      limit: 100,
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
    };
    if (startingAfter) params.starting_after = startingAfter;

    const response = await stripeClient.checkout.sessions.list(params);
    sessions.push(...response.data);
    
    hasMore = response.has_more;
    if (response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  return sessions;
}

// Get invoices for accurate pricing (with discounts applied)
async function getInvoices(stripeClient, startDate, endDate) {
  const invoices = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const params = {
      limit: 100,
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
      status: 'paid',
    };
    if (startingAfter) params.starting_after = startingAfter;

    const response = await stripeClient.invoices.list(params);
    invoices.push(...response.data);
    
    hasMore = response.has_more;
    if (response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  return invoices;
}

// Categorize a charge/payment
async function categorizePayment(stripeClient, charge, sessions) {
  // Try to find matching checkout session
  const session = sessions.find(s => s.payment_intent === charge.payment_intent);
  
  if (session) {
    if (session.mode === 'payment') {
      return 'single';
    } else if (session.mode === 'subscription') {
      // Need to check interval
      const subscription = session.subscription;
      if (subscription) {
        try {
          const sub = await stripeClient.subscriptions.retrieve(subscription);
          const interval = sub.items.data[0]?.price?.recurring?.interval;
          return interval === 'year' ? 'yearly' : 'monthly';
        } catch (e) {
          return 'monthly'; // Default to monthly if can't retrieve
        }
      }
    }
  }

  // Fallback: check description for keywords
  const desc = (charge.description || '').toLowerCase();
  if (desc.includes('credit') || desc.includes('one-off') || desc.includes('einzel')) {
    return 'single';
  }

  // Check if it's from a subscription invoice
  if (charge.invoice) {
    try {
      const invoice = await stripeClient.invoices.retrieve(charge.invoice);
      if (invoice.subscription) {
        const sub = await stripeClient.subscriptions.retrieve(invoice.subscription);
        const interval = sub.items.data[0]?.price?.recurring?.interval;
        return interval === 'year' ? 'yearly' : 'monthly';
      }
    } catch (e) {
      // Silent fail
    }
  }

  return 'single'; // Default to single if can't determine
}

// Main function to fetch SaaS data
export async function fetchSaaSData(startDate, endDate) {
  try {
    const [charges, sessions, activeSubscriptions, allSubscriptions, invoices] = await Promise.all([
      getCharges(stripeSaaS, startDate, endDate),
      getCheckoutSessions(stripeSaaS, startDate, endDate),
      getActiveSubscriptions(stripeSaaS),
      getAllSubscriptions(stripeSaaS),
      getInvoices(stripeSaaS, startDate, endDate),
    ]);

    // Categorize payments
    const categorizedPayments = [];
    for (const charge of charges) {
      const category = await categorizePayment(stripeSaaS, charge, sessions);
      categorizedPayments.push({
        ...charge,
        category,
        netAmount: calculateNet(centsToEuros(charge.amount)),
        grossAmount: centsToEuros(charge.amount),
        date: new Date(charge.created * 1000),
      });
    }

    // Calculate MRR from active subscriptions
    let monthlyMRR = 0;
    let yearlyMRR = 0;
    const monthlySubscribers = [];
    const yearlySubscribers = [];

    for (const sub of activeSubscriptions) {
      const item = sub.items.data[0];
      if (!item) continue;

      const interval = item.price?.recurring?.interval;
      
      // Get actual amount paid from latest invoice
      let amount = item.price?.unit_amount || 0;
      if (sub.latest_invoice) {
        try {
          const invoice = await stripeSaaS.invoices.retrieve(sub.latest_invoice);
          if (invoice.amount_paid) {
            amount = invoice.amount_paid;
          }
        } catch (e) {
          // Use price amount as fallback
        }
      }

      const netAmount = calculateNet(centsToEuros(amount));

      if (interval === 'year') {
        yearlyMRR += netAmount / 12;
        yearlySubscribers.push({
          id: sub.id,
          customerId: sub.customer,
          amount: netAmount,
          monthlyEquivalent: netAmount / 12,
          startDate: new Date(sub.start_date * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        });
      } else {
        monthlyMRR += netAmount;
        monthlySubscribers.push({
          id: sub.id,
          customerId: sub.customer,
          amount: netAmount,
          startDate: new Date(sub.start_date * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        });
      }
    }

    // Calculate single purchases
    const singlePurchases = categorizedPayments.filter(p => p.category === 'single');
    const monthlyPayments = categorizedPayments.filter(p => p.category === 'monthly');
    const yearlyPayments = categorizedPayments.filter(p => p.category === 'yearly');

    // Revenue by category
    const singleRevenue = singlePurchases.reduce((sum, p) => sum + p.netAmount, 0);
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.netAmount, 0);
    const yearlyRevenue = yearlyPayments.reduce((sum, p) => sum + p.netAmount, 0);

    // Average basket values
    const avgBasketMonthly = monthlyPayments.length > 0 
      ? monthlyPayments.reduce((sum, p) => sum + p.netAmount, 0) / monthlyPayments.length 
      : 0;
    const avgBasketYearly = yearlyPayments.length > 0 
      ? yearlyPayments.reduce((sum, p) => sum + p.netAmount, 0) / yearlyPayments.length 
      : 0;
    const avgBasketSingle = singlePurchases.length > 0 
      ? singlePurchases.reduce((sum, p) => sum + p.netAmount, 0) / singlePurchases.length 
      : 0;

    // Discount analysis
    const discounts = {
      monthly: [],
      yearly: [],
      single: [],
    };

    for (const invoice of invoices) {
      if (invoice.discount) {
        const originalAmount = invoice.subtotal;
        const discountedAmount = invoice.total;
        const discountPercent = originalAmount > 0 
          ? ((originalAmount - discountedAmount) / originalAmount) * 100 
          : 0;

        if (invoice.subscription) {
          try {
            const sub = await stripeSaaS.subscriptions.retrieve(invoice.subscription);
            const interval = sub.items.data[0]?.price?.recurring?.interval;
            if (interval === 'year') {
              discounts.yearly.push(discountPercent);
            } else {
              discounts.monthly.push(discountPercent);
            }
          } catch (e) {
            discounts.monthly.push(discountPercent);
          }
        } else {
          discounts.single.push(discountPercent);
        }
      }
    }

    const avgDiscountMonthly = discounts.monthly.length > 0 
      ? discounts.monthly.reduce((a, b) => a + b, 0) / discounts.monthly.length 
      : 0;
    const avgDiscountYearly = discounts.yearly.length > 0 
      ? discounts.yearly.reduce((a, b) => a + b, 0) / discounts.yearly.length 
      : 0;
    const avgDiscountSingle = discounts.single.length > 0 
      ? discounts.single.reduce((a, b) => a + b, 0) / discounts.single.length 
      : 0;

    // Churn calculation (subscriptions that ended in the period)
    const churnedSubs = allSubscriptions.filter(sub => {
      if (sub.status === 'canceled' || sub.status === 'ended') {
        const endedAt = sub.ended_at || sub.canceled_at;
        if (endedAt) {
          const endDate_ = new Date(endedAt * 1000);
          return endDate_ >= startDate && endDate_ <= endDate;
        }
      }
      return false;
    });

    // New subscriptions in period
    const newSubs = allSubscriptions.filter(sub => {
      const startedAt = new Date(sub.start_date * 1000);
      return startedAt >= startDate && startedAt <= endDate;
    });

    // Monthly breakdown for charts
    const monthlyBreakdown = {};
    for (const payment of categorizedPayments) {
      const monthKey = `${payment.date.getFullYear()}-${String(payment.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = {
          month: monthKey,
          yearly: 0,
          monthly: 0,
          single: 0,
          total: 0,
        };
      }
      monthlyBreakdown[monthKey][payment.category] += payment.netAmount;
      monthlyBreakdown[monthKey].total += payment.netAmount;
    }

    // MRR history (simplified - based on subscription start dates)
    const mrrHistory = {};
    for (const sub of allSubscriptions) {
      const startMonth = new Date(sub.start_date * 1000);
      const monthKey = `${startMonth.getFullYear()}-${String(startMonth.getMonth() + 1).padStart(2, '0')}`;
      
      if (!mrrHistory[monthKey]) {
        mrrHistory[monthKey] = { month: monthKey, mrr: 0, inflow: 0, outflow: 0 };
      }

      const item = sub.items.data[0];
      const interval = item?.price?.recurring?.interval;
      const amount = calculateNet(centsToEuros(item?.price?.unit_amount || 0));
      const mrrContribution = interval === 'year' ? amount / 12 : amount;

      if (sub.status === 'active' || sub.status === 'trialing') {
        mrrHistory[monthKey].inflow += mrrContribution;
      }
    }

    // Add outflow from churned subscriptions
    for (const sub of churnedSubs) {
      const endedAt = sub.ended_at || sub.canceled_at;
      if (endedAt) {
        const endMonth = new Date(endedAt * 1000);
        const monthKey = `${endMonth.getFullYear()}-${String(endMonth.getMonth() + 1).padStart(2, '0')}`;
        
        if (!mrrHistory[monthKey]) {
          mrrHistory[monthKey] = { month: monthKey, mrr: 0, inflow: 0, outflow: 0 };
        }

        const item = sub.items.data[0];
        const interval = item?.price?.recurring?.interval;
        const amount = calculateNet(centsToEuros(item?.price?.unit_amount || 0));
        const mrrContribution = interval === 'year' ? amount / 12 : amount;

        mrrHistory[monthKey].outflow += mrrContribution;
      }
    }

    return {
      totalRevenue: singleRevenue + monthlyRevenue + yearlyRevenue,
      singleRevenue,
      monthlyRevenue,
      yearlyRevenue,
      mrr: monthlyMRR + yearlyMRR,
      monthlyMRR,
      yearlyMRR,
      arr: (monthlyMRR + yearlyMRR) * 12,
      activeSubscribers: activeSubscriptions.length,
      monthlySubscribers: monthlySubscribers.length,
      yearlySubscribers: yearlySubscribers.length,
      singlePurchaseCount: singlePurchases.length,
      avgBasketMonthly,
      avgBasketYearly,
      avgBasketSingle,
      avgDiscountMonthly,
      avgDiscountYearly,
      avgDiscountSingle,
      churnCount: churnedSubs.length,
      churnRate: activeSubscriptions.length > 0 
        ? (churnedSubs.length / (activeSubscriptions.length + churnedSubs.length)) * 100 
        : 0,
      newSubscriptions: newSubs.length,
      monthlyBreakdown: Object.values(monthlyBreakdown).sort((a, b) => a.month.localeCompare(b.month)),
      mrrHistory: Object.values(mrrHistory).sort((a, b) => a.month.localeCompare(b.month)),
      inflowOutflow: Object.values(mrrHistory).sort((a, b) => a.month.localeCompare(b.month)),
    };
  } catch (error) {
    console.error('Error fetching SaaS data:', error);
    throw error;
  }
}

// Main function to fetch Agency data
export async function fetchAgencyData(startDate, endDate) {
  try {
    const [charges, sessions] = await Promise.all([
      getCharges(stripeAgency, startDate, endDate),
      getCheckoutSessions(stripeAgency, startDate, endDate),
    ]);

    // All agency charges are single video purchases
    const payments = charges.map(charge => ({
      ...charge,
      netAmount: calculateNet(centsToEuros(charge.amount)),
      grossAmount: centsToEuros(charge.amount),
      date: new Date(charge.created * 1000),
    }));

    const totalRevenue = payments.reduce((sum, p) => sum + p.netAmount, 0);
    const avgBasket = payments.length > 0 ? totalRevenue / payments.length : 0;

    // Monthly breakdown
    const monthlyBreakdown = {};
    for (const payment of payments) {
      const monthKey = `${payment.date.getFullYear()}-${String(payment.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = {
          month: monthKey,
          stripeRevenue: 0,
          sevdeskRevenue: 0, // Placeholder for Sevdesk
          total: 0,
          orderCount: 0,
        };
      }
      monthlyBreakdown[monthKey].stripeRevenue += payment.netAmount;
      monthlyBreakdown[monthKey].total += payment.netAmount;
      monthlyBreakdown[monthKey].orderCount += 1;
    }

    return {
      totalRevenue,
      orderCount: payments.length,
      avgBasket,
      monthlyBreakdown: Object.values(monthlyBreakdown).sort((a, b) => a.month.localeCompare(b.month)),
      // Sevdesk placeholders
      sevdeskRevenue: 0,
      sevdeskOrderCount: 0,
      sevdeskAvgBasket: 0,
    };
  } catch (error) {
    console.error('Error fetching agency data:', error);
    throw error;
  }
}

// Get all customers for CLV calculation
export async function getCustomerData() {
  try {
    const customers = [];
    let hasMore = true;
    let startingAfter = null;

    while (hasMore) {
      const params = { limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;

      const response = await stripeSaaS.customers.list(params);
      customers.push(...response.data);
      
      hasMore = response.has_more;
      if (response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id;
      }
    }

    // Get total spent per customer
    const customerData = [];
    for (const customer of customers) {
      const charges = await stripeSaaS.charges.list({
        customer: customer.id,
        limit: 100,
      });

      const totalSpent = charges.data
        .filter(c => c.paid && !c.refunded)
        .reduce((sum, c) => sum + calculateNet(centsToEuros(c.amount)), 0);

      customerData.push({
        id: customer.id,
        email: customer.email,
        created: new Date(customer.created * 1000),
        totalSpent,
      });
    }

    // Calculate CLV (average total spent)
    const clv = customerData.length > 0 
      ? customerData.reduce((sum, c) => sum + c.totalSpent, 0) / customerData.length 
      : 0;

    return {
      totalCustomers: customers.length,
      clv,
      customerData,
    };
  } catch (error) {
    console.error('Error fetching customer data:', error);
    throw error;
  }
}
