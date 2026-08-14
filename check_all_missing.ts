import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import mongoose from 'mongoose';
import axios from 'axios';

async function check() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) { console.error('No MONGODB_URI'); return; }
  
  await mongoose.connect(MONGODB_URI);
  const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');

  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  
  let skip = 0;
  let rzpPayments: any[] = [];
  
  while (true) {
    const res = await axios.get(`https://api.razorpay.com/v1/payments?count=100&skip=${skip}`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const items = res.data.items;
    if (!items || items.length === 0) break;
    rzpPayments = rzpPayments.concat(items);
    skip += 100;
    if (skip >= 1000) break;
  }
  
  let missingTotal = 0;
  let pendingCount = 0;
  
  for (const p of rzpPayments) {
    if (p.status === 'captured') {
        const anyDbOrder = await Order.findOne({ payment_id: p.id });
        if (!anyDbOrder) {
            console.log(`Razorpay Payment entirely missing from DB: ${p.id} Amount: ${p.amount/100}`);
            missingTotal += (p.amount / 100);
            
            // Insert it
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
        } else if ((anyDbOrder as any).status !== 'paid') {
            console.log(`Razorpay Payment is pending in DB: ${p.id} Amount: ${p.amount/100}`);
            await Order.updateOne({ _id: anyDbOrder._id }, { $set: { status: 'paid' } });
            pendingCount++;
        }
    }
  }
  console.log("Missing revenue entirely:", missingTotal);
  console.log("Pending orders updated:", pendingCount);
  
  process.exit(0);
}

check();
