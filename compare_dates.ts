import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getDateRange30d() {
  const now = new Date();
  const istTime = new Date(now.getTime() + IST_OFFSET_MS);
  
  let fromIST = new Date(istTime);
  let toIST = new Date(istTime);

  fromIST.setUTCDate(fromIST.getUTCDate() - 29);
  fromIST.setUTCHours(0, 0, 0, 0);
  toIST.setUTCHours(23, 59, 59, 999);
      
  return { 
    from: new Date(fromIST.getTime() - IST_OFFSET_MS), 
    to: new Date(toIST.getTime() - IST_OFFSET_MS) 
  };
}

async function check() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) { console.error('No MONGODB_URI'); return; }
  
  await mongoose.connect(MONGODB_URI);
  const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');

  const range30d = getDateRange30d();
  
  const fromRazorpay = new Date("2026-07-19T00:00:00.000Z"); 
  const toRazorpay = new Date("2026-08-14T23:59:59.999Z"); 

  const orders30d = await Order.find({ created_at: { $gte: range30d.from, $lte: range30d.to }, status: 'paid' }).lean();
  const ordersRzp = await Order.find({ created_at: { $gte: fromRazorpay, $lte: toRazorpay }, status: 'paid' }).lean();

  const diff = ordersRzp.filter((ro: any) => !orders30d.find((do30: any) => do30._id.toString() === ro._id.toString()));
  const diff2 = orders30d.filter((do30: any) => !ordersRzp.find((ro: any) => ro._id.toString() === do30._id.toString()));

  console.log("In Razorpay range but NOT in 30d range:", diff.map(o => ({ id: o._id, amount: o.amount, date: o.created_at })));
  console.log("In 30d range but NOT in Razorpay range:", diff2.map(o => ({ id: o._id, amount: o.amount, date: o.created_at })));

  process.exit(0);
}

check();
