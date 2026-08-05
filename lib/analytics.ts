import { connectDB, Order, Event, Session } from './db';
import { startOfDay, endOfDay, subDays, startOfMonth, format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export type DateRange = { from: Date; to: Date };

const TIMEZONE = 'Asia/Kolkata';

export function getDateRange(period: string): DateRange {
  const now = new Date();
  const nowIST = toZonedTime(now, TIMEZONE);
  
  let fromIST, toIST;

  switch (period) {
    case 'today':
      fromIST = startOfDay(nowIST);
      toIST = endOfDay(nowIST);
      break;
    case 'yesterday':
      fromIST = startOfDay(subDays(nowIST, 1));
      toIST = endOfDay(subDays(nowIST, 1));
      break;
    case '7d':
      fromIST = startOfDay(subDays(nowIST, 6));
      toIST = endOfDay(nowIST);
      break;
    case '30d':
      fromIST = startOfDay(subDays(nowIST, 29));
      toIST = endOfDay(nowIST);
      break;
    case 'month':
      fromIST = startOfMonth(nowIST);
      toIST = endOfDay(nowIST);
      break;
    default:
      fromIST = new Date('2024-01-01');
      toIST = endOfDay(nowIST);
  }
  
  return { 
    from: fromZonedTime(fromIST, TIMEZONE), 
    to: fromZonedTime(toIST, TIMEZONE) 
  };
}

export function getPreviousPeriod(range: DateRange): DateRange {
  const diff = range.to.getTime() - range.from.getTime();
  return { from: new Date(range.from.getTime() - diff), to: new Date(range.to.getTime() - diff) };
}

// ─── Order Analytics ──────────────────────────────────────────────────────────
export async function getOrderMetrics(range: DateRange) {
  await connectDB();
  const { from, to } = range;

  const [allOrders, successOrders, failedOrders, refundedOrders] = await Promise.all([
    Order.find({ created_at: { $gte: from, $lte: to } }).lean(),
    Order.find({ created_at: { $gte: from, $lte: to }, status: 'paid' }).lean(),
    Order.find({ created_at: { $gte: from, $lte: to }, status: { $in: ['failed', 'expired'] } }).lean(),
    Order.find({ created_at: { $gte: from, $lte: to }, status: 'refunded' }).lean(),
  ]);

  const grossRevenue = successOrders.reduce((s: number, o: any) => s + (o.amount || 0), 0);
  const refundAmount = refundedOrders.reduce((s: number, o: any) => s + (o.amount || 0), 0);
  const masterOrders = successOrders.filter((o: any) => o.customer_details?.type === 'master' || o.amount === 49);
  const ultimateOrders = successOrders.filter((o: any) => o.customer_details?.type === 'ultimate' || o.amount === 149);
  const avgOrderValue = successOrders.length > 0 ? grossRevenue / successOrders.length : 0;

  return {
    totalOrders: allOrders.length,
    successfulPayments: successOrders.length,
    failedPayments: failedOrders.length,
    refundedPayments: refundedOrders.length,
    pendingPayments: allOrders.filter((o: any) => o.status === 'pending').length,
    grossRevenue,
    refundAmount,
    netRevenue: grossRevenue - refundAmount,
    masterOrders: masterOrders.length,
    ultimateOrders: ultimateOrders.length,
    avgOrderValue,
    // Estimated Razorpay fees (~2% blended)
    estimatedRazorpayFees: grossRevenue * 0.02,
    estimatedGST: grossRevenue * 0.02 * 0.18,
  };
}

// ─── Daily Revenue Trend ──────────────────────────────────────────────────────
export async function getDailyRevenue(range: DateRange) {
  await connectDB();
  const { from, to } = range;
  const orders = await Order.find({
    created_at: { $gte: from, $lte: to },
    status: 'paid',
  }).lean();

  const byDay: Record<string, { revenue: number; count: number }> = {};
  (orders as any[]).forEach(o => {
    // Convert to IST before extracting the day string
    const istDate = toZonedTime(new Date(o.created_at), TIMEZONE);
    const day = format(istDate, 'yyyy-MM-dd');
    if (!byDay[day]) byDay[day] = { revenue: 0, count: 0 };
    byDay[day].revenue += o.amount || 0;
    byDay[day].count += 1;
  });

  return Object.entries(byDay).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Funnel Analytics ─────────────────────────────────────────────────────────
export async function getFunnelSteps(range: DateRange, category?: string) {
  await connectDB();
  const { from, to } = range;
  const match: any = { timestamp: { $gte: from, $lte: to } };
  if (category) match.category = category;

  const steps = [
    'page_view', 'quiz_start', 'question_view_1', 'question_view_2',
    'question_view_3', 'question_view_4', 'question_view_5',
    'question_view_6', 'question_view_7', 'question_view_8',
    'question_view_9', 'question_view_10',
    'analysis_start', 'checkout_view', 'payment_initiated',
    'payment_success', 'report_view',
  ];

  const counts = await Event.aggregate([
    { $match: match },
    { $group: { _id: '$event_name', sessions: { $addToSet: '$session_id' } } },
    { $project: { event: '$_id', count: { $size: '$sessions' } } },
  ]);

  const countMap: Record<string, number> = {};
  counts.forEach((c: any) => { countMap[c.event] = c.count; });

  return steps.map((step, i) => {
    const count = countMap[step] || 0;
    const prev = i > 0 ? (countMap[steps[i - 1]] || 0) : count;
    return {
      step,
      label: stepLabel(step),
      users: count,
      conversionRate: prev > 0 ? (count / prev) * 100 : 0,
      dropoffRate: prev > 0 ? ((prev - count) / prev) * 100 : 0,
    };
  });
}

function stepLabel(step: string): string {
  const labels: Record<string, string> = {
    page_view: 'Landing Page',
    quiz_start: 'Quiz Started',
    question_view_1: 'Q1: Category',
    question_view_2: 'Q2: Category-specific',
    question_view_3: 'Q3',
    question_view_4: 'Q4',
    question_view_5: 'Q5: Birth Day',
    question_view_6: 'Q6: Birth Month',
    question_view_7: 'Q7: Birth Year',
    question_view_8: 'Q8: Name',
    question_view_9: 'Q9: Gender',
    question_view_10: 'Q10: Phone',
    analysis_start: 'Analysis Screen',
    checkout_view: 'Checkout Viewed',
    payment_initiated: 'Payment Initiated',
    payment_success: 'Payment Success',
    report_view: 'Report Viewed',
  };
  return labels[step] || step;
}

// ─── Question Analytics ────────────────────────────────────────────────────────
export async function getQuestionAnalytics(range: DateRange) {
  await connectDB();
  const { from, to } = range;

  const answers = await Event.aggregate([
    { $match: { timestamp: { $gte: from, $lte: to }, event_name: 'answer_selected' } },
    { $group: {
      _id: { question_id: '$question_id', answer_value: '$answer_value', category: '$category' },
      count: { $sum: 1 },
      sessions: { $addToSet: '$session_id' },
    }},
    { $project: { question_id: '$_id.question_id', answer_value: '$_id.answer_value', category: '$_id.category', count: 1, sessionCount: { $size: '$sessions' } } },
    { $sort: { question_id: 1, count: -1 } },
  ]);

  // Group by question
  const byQuestion: Record<string, any[]> = {};
  answers.forEach((a: any) => {
    const key = a.question_id;
    if (!byQuestion[key]) byQuestion[key] = [];
    byQuestion[key].push(a);
  });

  return byQuestion;
}

// ─── Traffic & Attribution ─────────────────────────────────────────────────────
export async function getTrafficSources(range: DateRange) {
  await connectDB();
  const { from, to } = range;

  return Event.aggregate([
    { $match: { timestamp: { $gte: from, $lte: to }, event_name: 'page_view' } },
    { $group: {
      _id: { source: '$utm_source', medium: '$utm_medium' },
      sessions: { $addToSet: '$session_id' },
      devices: { $addToSet: '$device_type' },
    }},
    { $project: {
      source: { $ifNull: ['$_id.source', 'direct'] },
      medium: { $ifNull: ['$_id.medium', 'none'] },
      sessionCount: { $size: '$sessions' },
    }},
    { $sort: { sessionCount: -1 } },
  ]);
}

// ─── Live Sessions ─────────────────────────────────────────────────────────────
export async function getLiveSessions(minutesAgo = 5) {
  await connectDB();
  const cutoff = new Date(Date.now() - minutesAgo * 60 * 1000);
  return Event.aggregate([
    { $match: { timestamp: { $gte: cutoff } } },
    { $group: {
      _id: '$session_id',
      lastEvent: { $last: '$event_name' },
      lastSeen: { $max: '$timestamp' },
      category: { $last: '$category' },
      device: { $last: '$device_type' },
    }},
    { $sort: { lastSeen: -1 } },
    { $limit: 50 },
  ]);
}

// ─── Recent Orders ─────────────────────────────────────────────────────────────
export async function getRecentOrders(limit = 50, page = 0, query?: string) {
  await connectDB();
  const filter: any = {};
  if (query) {
    filter.$or = [
      { order_id: { $regex: query, $options: 'i' } },
      { payment_id: { $regex: query, $options: 'i' } },
      { 'customer_details.name': { $regex: query, $options: 'i' } },
      { 'customer_details.phone': { $regex: query, $options: 'i' } },
    ];
  }
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ created_at: -1 }).skip(page * limit).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  return { orders, total };
}

export async function getOrderById(orderId: string) {
  await connectDB();
  const order = await Order.findOne({ $or: [{ order_id: orderId }, { _id: orderId }] }).lean();
  if (!order) return null;
  // Fetch session events for this order
  const events = await Event.find({ order_id: (order as any).order_id }).sort({ timestamp: 1 }).lean();
  return { order, events };
}

// ─── Report Product Analytics ─────────────────────────────────────────────────
export async function getReportAnalytics(range: DateRange) {
  await connectDB();
  const { from, to } = range;

  const [masterOrders, ultimateOrders] = await Promise.all([
    Order.find({ created_at: { $gte: from, $lte: to }, status: 'paid', $or: [{ 'customer_details.type': 'master' }, { amount: 49 }] }).lean(),
    Order.find({ created_at: { $gte: from, $lte: to }, status: 'paid', $or: [{ 'customer_details.type': 'ultimate' }, { amount: 149 }] }).lean(),
  ]);

  const masterRevenue = masterOrders.reduce((s: number, o: any) => s + (o.amount || 49), 0);
  const ultimateRevenue = ultimateOrders.reduce((s: number, o: any) => s + (o.amount || 149), 0);

  return [
    { type: 'master', name: 'Master Report', price: 49, orders: masterOrders.length, revenue: masterRevenue, aov: 49 },
    { type: 'ultimate', name: 'Ultimate Report', price: 149, orders: ultimateOrders.length, revenue: ultimateRevenue, aov: 149 },
  ];
}

// ─── Cohort Analytics ──────────────────────────────────────────────────────────
export async function getCohortData(range: DateRange) {
  await connectDB();
  const { from, to } = range;
  const paidOrders = await Order.find({ created_at: { $gte: from, $lte: to }, status: 'paid' }).lean();

  // Group by phone to find repeat customers
  const byPhone: Record<string, any[]> = {};
  (paidOrders as any[]).forEach(o => {
    const phone = o.customer_details?.phone || 'unknown';
    if (!byPhone[phone]) byPhone[phone] = [];
    byPhone[phone].push(o);
  });

  const uniqueCustomers = Object.keys(byPhone).length;
  const repeatCustomers = Object.values(byPhone).filter(orders => orders.length > 1).length;
  const totalOrders = paidOrders.length;

  return {
    uniqueCustomers,
    repeatCustomers,
    repeatRate: uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0,
    totalOrders,
    avgOrdersPerCustomer: uniqueCustomers > 0 ? totalOrders / uniqueCustomers : 0,
  };
}
