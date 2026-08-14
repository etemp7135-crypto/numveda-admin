import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function check() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) { console.log('no uri'); return; }
  await mongoose.connect(MONGODB_URI);
  const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');

  const allOrders = await Order.find({ status: 'paid' }).lean();
  let total = 0;
  for (const o of allOrders) {
    const amt = (o as any).amount || 0;
    if (amt !== 49 && amt !== 149 && amt !== 199) {
        console.log('Paid order weird amount:', amt, (o as any).order_id);
    }
    total += amt;
  }
  console.log('Total:', total);
  process.exit(0);
}
check();
