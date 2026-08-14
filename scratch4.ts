import mongoose from 'mongoose';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function check() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) { console.log('no uri'); return; }
  await mongoose.connect(MONGODB_URI);
  const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');

  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

  try {
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
    }
    
    let rzpCapturedTotal = 0;
    let notInDb = 0;
    let wrongStatus = 0;
    
    for (const p of rzpPayments) {
        if (p.status === 'captured') {
            const amt = p.amount / 100;
            rzpCapturedTotal += amt;
            
            const dbOrder = await Order.findOne({ payment_id: p.id }).lean();
            if (!dbOrder) {
                // maybe it's linked by order_id?
                const dbOrder2 = await Order.findOne({ order_id: p.order_id }).lean();
                if (!dbOrder2) {
                    console.log('Payment not in DB at all:', p.id, amt, p.created_at);
                    notInDb += amt;
                } else if ((dbOrder2 as any).status !== 'paid') {
                    console.log('Payment in DB but status is', (dbOrder2 as any).status, 'for', p.id, amt);
                    wrongStatus += amt;
                }
            } else if ((dbOrder as any).status !== 'paid') {
                console.log('Payment in DB by payment_id but status is', (dbOrder as any).status, 'for', p.id, amt);
                wrongStatus += amt;
            }
        }
    }
    
    console.log('Total Captured in Razorpay:', rzpCapturedTotal);
    console.log('Amount not in DB:', notInDb);
    console.log('Amount with wrong status:', wrongStatus);

  } catch (err: any) {
    console.error(err.message);
  }
  process.exit(0);
}
check();
