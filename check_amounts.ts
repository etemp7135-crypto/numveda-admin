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
  
  while (true) {
    const res = await axios.get(`https://api.razorpay.com/v1/payments?count=100&skip=${skip}`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const items = res.data.items;
    if (!items || items.length === 0) break;
    rzpPayments = rzpPayments.concat(items);
    skip += 100;
    if (skip >= 3000) break; 
  }
  
  let mismatchedCount = 0;
  let mismatchedDiff = 0;
  
  for (const p of rzpPayments) {
    if (p.status === 'captured') {
      const dbOrder = await Order.findOne({ payment_id: p.id });
      if (dbOrder) {
         const dbAmt = (dbOrder as any).amount || 0;
         const pAmt = p.amount / 100;
         if (dbAmt !== pAmt) {
             console.log(`Mismatch for ${p.id}: DB amount is ${dbAmt}, Razorpay amount is ${pAmt}`);
             mismatchedCount++;
             mismatchedDiff += (pAmt - dbAmt);
             
             // Update the DB amount to match Razorpay amount
             await Order.updateOne({ _id: dbOrder._id }, { $set: { amount: pAmt } });
         }
      }
    }
  }
  
  console.log(`\nAmount check complete.`);
  console.log(`Total orders with mismatched amounts: ${mismatchedCount}`);
  console.log(`Total difference: ₹${mismatchedDiff}`);
  
  process.exit(0);
}

check();
