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
  
  const fromRazorpayIST = new Date(fromRazorpay.getTime() - IST_OFFSET_MS);
  const toRazorpayIST = new Date(toRazorpay.getTime() - IST_OFFSET_MS);

  const orders30d = await Order.find({ created_at: { $gte: range30d.from, $lte: range30d.to }, status: 'paid' }).lean();
  const ordersRzpUTC = await Order.find({ created_at: { $gte: fromRazorpay, $lte: toRazorpay }, status: 'paid' }).lean();
  const ordersRzpIST = await Order.find({ created_at: { $gte: fromRazorpayIST, $lte: toRazorpayIST }, status: 'paid' }).lean();

  const dbGross30d = orders30d.reduce((s: number, o: any) => s + (o.amount || 0), 0);
  const dbGrossRzpUTC = ordersRzpUTC.reduce((s: number, o: any) => s + (o.amount || 0), 0);
  const dbGrossRzpIST = ordersRzpIST.reduce((s: number, o: any) => s + (o.amount || 0), 0);

  console.log("Range 30d:", range30d.from.toISOString(), "to", range30d.to.toISOString(), "=> SUM:", dbGross30d);
  console.log("Range Rzp UTC:", fromRazorpay.toISOString(), "to", toRazorpay.toISOString(), "=> SUM:", dbGrossRzpUTC);
  console.log("Range Rzp IST:", fromRazorpayIST.toISOString(), "to", toRazorpayIST.toISOString(), "=> SUM:", dbGrossRzpIST);

  process.exit(0);
}

check();
