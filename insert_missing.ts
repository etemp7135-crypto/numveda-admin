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

  const successOrders = await Order.find({ created_at: { $gte: range.from, $lte: range.to }, status: 'paid' }).lean();

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
  
  let missingTotal = 0;
  let insertedCount = 0;
  
  for (const p of rzpPayments) {
    if (p.created_at >= cutoff && p.created_at <= cutoffTo && p.status === 'captured') {
        const dbOrder = successOrders.find((o: any) => o.payment_id === p.id || o.order_id === p.order_id);
        // Also verify the order isn't in DB outside successOrders (e.g. somehow failed)
        if (!dbOrder) {
            const anyDbOrder = await Order.findOne({ payment_id: p.id });
            if (!anyDbOrder) {
                console.log(`Inserting missing Razorpay Payment: ${p.id} Amount: ${p.amount/100}`);
                
                const newOrder = new Order({
                    order_id: p.order_id || `rec_missing_${p.id}`,
                    payment_id: p.id,
                    status: 'paid',
                    amount: p.amount / 100,
                    currency: p.currency,
                    customer_details: {
                        name: 'Recovered User',
                        email: p.email,
                        phone: p.contact,
                        type: p.amount === 14900 || p.amount === 19900 ? 'ultimate' : 'master'
                    },
                    created_at: new Date(p.created_at * 1000)
                });
                await newOrder.save();
                
                insertedCount++;
                missingTotal += (p.amount / 100);
            }
        }
    }
  }
  console.log("Missing orders inserted:", insertedCount);
  console.log("Missing revenue recovered:", missingTotal);
  
  process.exit(0);
}

check();
