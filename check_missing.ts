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

  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  
  let skip = 0;
  let rzpPayments: any[] = [];
  
  // Last 35 days in seconds
  const cutoff = Math.floor(Date.now() / 1000) - 35 * 86400;
  
  while (true) {
    const res = await axios.get(`https://api.razorpay.com/v1/payments?count=100&skip=${skip}`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const items = res.data.items;
    if (!items || items.length === 0) break;
    
    rzpPayments = rzpPayments.concat(items);
    skip += 100;
    
    // Stop if the last item in this page is older than cutoff
    if (items[items.length - 1].created_at < cutoff) {
        break;
    }
  }
  
  let missingCount = 0;
  let missingTotal = 0;
  
  for (const p of rzpPayments) {
    if (p.created_at >= cutoff && p.status === 'captured') {
      const dbOrder = await Order.findOne({ payment_id: p.id });
      if (!dbOrder) {
         const dbOrder2 = await Order.findOne({ order_id: p.order_id });
         if (!dbOrder2) {
             const amt = p.amount / 100;
             missingCount++;
             missingTotal += amt;
             console.log(`Payment entirely missing from DB: ${p.id} Amount: ₹${amt} Date: ${new Date(p.created_at * 1000).toISOString()}`);
         }
      }
    }
  }
  
  console.log(`\nCheck missing complete.`);
  console.log(`Total missing orders in last 35 days: ${missingCount}`);
  console.log(`Total missing revenue: ₹${missingTotal}`);
  
  process.exit(0);
}

check();
