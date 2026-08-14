import mongoose from 'mongoose';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function check() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) { console.error('No MONGODB_URI'); return; }
  
  await mongoose.connect(MONGODB_URI);
  const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');

  const from = new Date("2026-07-19T00:00:00.000Z"); // July 19 UTC
  const to = new Date("2026-08-14T23:59:59.999Z"); // Aug 14 UTC

  const successOrders = await Order.find({ created_at: { $gte: from, $lte: to }, status: 'paid' }).lean();
  const dbGross = successOrders.reduce((s: number, o: any) => s + (o.amount || 0), 0);
  console.log("DB Gross Revenue from July 19 to Aug 14 (UTC):", dbGross);

  // Now in IST
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const fromIST = new Date(from.getTime() - IST_OFFSET_MS);
  const toIST = new Date(to.getTime() - IST_OFFSET_MS);

  const successOrdersIST = await Order.find({ created_at: { $gte: fromIST, $lte: toIST }, status: 'paid' }).lean();
  const dbGrossIST = successOrdersIST.reduce((s: number, o: any) => s + (o.amount || 0), 0);
  console.log("DB Gross Revenue from July 19 to Aug 14 (IST bounds):", dbGrossIST);

  process.exit(0);
}

check();
