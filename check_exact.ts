import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import mongoose from 'mongoose';
import axios from 'axios';

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
  
  const range = getDateRange30d();
  console.log("Date Range:", range.from.toISOString(), "to", range.to.toISOString());

  const successOrders = await Order.find({ created_at: { $gte: range.from, $lte: range.to }, status: 'paid' }).lean();
  const grossRevenue = successOrders.reduce((s: number, o: any) => s + (o.amount || 0), 0);
  console.log("DB Gross Revenue for 30d:", grossRevenue);

  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  
  let skip = 0;
  let rzpPayments: any[] = [];
  
  const cutoff = Math.floor(range.from.getTime() / 1000);
  const cutoffTo = Math.floor(range.to.getTime() / 1000);
  
  while (true) {
    const res = await axios.get(`https://api.razorpay.com/v1/payments?count=100&skip=${skip}`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const items = res.data.items;
    if (!items || items.length === 0) break;
    rzpPayments = rzpPayments.concat(items);
    skip += 100;
    
    if (items[items.length - 1].created_at < cutoff) {
        break;
    }
  }
  
  let rzpGross = 0;
  let missingTotal = 0;
  for (const p of rzpPayments) {
    if (p.created_at >= cutoff && p.created_at <= cutoffTo && p.status === 'captured') {
        rzpGross += (p.amount / 100);
        
        const dbOrder = successOrders.find((o: any) => o.payment_id === p.id || o.order_id === p.order_id);
        if (!dbOrder) {
            console.log(`Razorpay Payment NOT in DB successOrders: ${p.id} Amount: ${p.amount/100} Created At: ${new Date(p.created_at * 1000).toISOString()}`);
            missingTotal += (p.amount / 100);
        }
    }
  }
  console.log("Razorpay Captured Payments Total for 30d:", rzpGross);
  console.log("Missing from successOrders total:", missingTotal);
  
  process.exit(0);
}

check();
