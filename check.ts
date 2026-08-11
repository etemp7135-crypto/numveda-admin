import { connectDB, Order, Event } from './lib/db';
import { fetchPayments } from './lib/razorpay';
import { getFunnelSteps, getDateRange } from './lib/analytics';
async function run() {
  try {
    await connectDB();
    const range = getDateRange('today');
    const funnel = await getFunnelSteps(range);
    console.log("FUNNEL TODAY:", JSON.stringify(funnel, null, 2));
    
    // Check recent errors in events
    const errors = await Event.find({ step: 'error' }).sort({ timestamp: -1 }).limit(5);
    console.log("RECENT ERRORS:", JSON.stringify(errors, null, 2));

    const range7d = getDateRange('7d');
    const funnel7d = await getFunnelSteps(range7d);
    console.log("FUNNEL 7d:", JSON.stringify(funnel7d, null, 2));
    
    const recentOrders = await Order.find().sort({ created_at: -1 }).limit(5);
    console.log("RECENT ORDERS DB:", JSON.stringify(recentOrders, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
