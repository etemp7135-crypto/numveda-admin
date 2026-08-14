import mongoose from 'mongoose';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function reconcile() {
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
  
  let updatedCount = 0;
  let totalRecovered = 0;
  
  for (const p of rzpPayments) {
    if (p.status === 'captured') {
      const dbOrder = await Order.findOne({ payment_id: p.id });
      if (dbOrder && (dbOrder as any).status !== 'paid') {
         await Order.updateOne({ _id: dbOrder._id }, { $set: { status: 'paid' } });
         const amt = p.amount / 100;
         updatedCount++;
         totalRecovered += amt;
         console.log(`Updated payment ${p.id} from ${(dbOrder as any).status} to paid. Amount: ₹${amt}`);
      } else if (!dbOrder) {
         const dbOrder2 = await Order.findOne({ order_id: p.order_id });
         if (dbOrder2 && (dbOrder2 as any).status !== 'paid') {
             await Order.updateOne({ _id: dbOrder2._id }, { $set: { status: 'paid', payment_id: p.id } });
             const amt = p.amount / 100;
             updatedCount++;
             totalRecovered += amt;
             console.log(`Updated order ${p.order_id} (payment: ${p.id}) from ${(dbOrder2 as any).status} to paid. Amount: ₹${amt}`);
         }
      }
    }
  }
  
  console.log(`\nReconciliation 2 complete.`);
  console.log(`Total orders updated to paid: ${updatedCount}`);
  console.log(`Total revenue recovered: ₹${totalRecovered}`);
  
  process.exit(0);
}

reconcile();
