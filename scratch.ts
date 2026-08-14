import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function check() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) { console.log('no uri'); return; }
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.useDb('test'); // Check if the DB is correct, let's use default
  const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');

  const orders = await Order.find({ status: 'paid' }).lean();
  let total = 0;
  for (const o of orders) {
    total += o.amount || 0;
  }
  console.log('Total paid amount:', total);
  
  const allOrders = await Order.find({}).lean();
  let allTotal = 0;
  for (const o of allOrders) {
    if ((o as any).status !== 'paid') {
        console.log('Not paid order:', (o as any).amount, (o as any).status, (o as any).order_id);
    }
  }
  process.exit(0);
}
check();
