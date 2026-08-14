import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function check() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) { console.error('No MONGODB_URI'); return; }
  
  await mongoose.connect(MONGODB_URI);
  const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');

  const recentPaid = await Order.find({ status: 'paid' }).sort({ created_at: -1 }).limit(10).lean();
  
  console.log("Recent Paid Orders:");
  recentPaid.forEach((o: any) => console.log(`${o._id} | ${o.order_id} | ${o.payment_id} | ${new Date(o.created_at).toISOString()}`));

  process.exit(0);
}

check();
