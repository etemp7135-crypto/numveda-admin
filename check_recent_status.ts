import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function check() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) { console.error('No MONGODB_URI'); return; }
  
  await mongoose.connect(MONGODB_URI);
  const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');

  const o1 = await Order.findOne({ payment_id: 'pay_TPeGxZ6CI8xb6q' });
  console.log("Order 1:", o1.status, o1.created_at);
  const o2 = await Order.findOne({ payment_id: 'pay_TPeEgehVh1znPr' });
  console.log("Order 2:", o2.status, o2.created_at);

  process.exit(0);
}

check();
